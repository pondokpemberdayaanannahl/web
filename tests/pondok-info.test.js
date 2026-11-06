import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import * as pondok from '../src/data/pondok.js';
import * as images from '../src/data/photos.js';
import {Program} from '../src/pages/program.js';
import {Footer} from '../src/components/footer.js';
import {WhatsAppButton} from '../src/components/whatsapp.js';
import {socialIcon} from '../src/components/social-icon.js';
import {jenjangCards,tiktokHandle,tiktokUrl} from '../src/pondok-settings.js';
import {ATTACHMENT_HELP} from '../src/google-forms.js';

function markup(file,component){
 const {document}=parseHTML('<html><body></body></html>');
 const context={...pondok,...images,socialIcon,jenjangCards,tiktokUrl,ATTACHMENT_HELP,window:{},document};
 const source=readFileSync(new URL(`../src/pages/${file}.js`,import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replaceAll('export ','');
 vm.runInNewContext(source,context);return context[component]();
}
const main=['Program Tahfidz Quran','Pendidikan Madrasah Muhadloroh','Pendidikan Formal (SMP/SMA)','Tarbiyah Akhlak Islamiyah'];
const featured=['Kajian kitab salaf','Tahfidzul Quran','Arabic English Language','Life skill'];
const activities=['Pramuka','AHS (An Nahl Hadroh Sholawat)','Komputer','Bela Diri (Khalifah Bumi)','Public Speaking','Multimedia','Perikanan',"Majelis Qira'atul Kutub","Jam'iyah Quro wal Huffaz",'Kewirausahaan','Otomotif','Melukis','Pertanian','Peternakan'];

test('program page contains the supplied four main programs, four featured programs and all fourteen extracurricular activities',()=>{
 const {document}=parseHTML(Program());
 const titles=selector=>[...document.querySelectorAll(selector)].map(node=>node.textContent);
 assert.deepEqual(titles('#program-pesantren .card-title'),main);
 assert.deepEqual(titles('#program-unggulan .card-title'),featured);
 assert.deepEqual(titles('#ekstrakurikuler .card-title'),activities);
});

test('home programs remain visible and registration starts locked while loading settings',()=>{
 const home=parseHTML(markup('beranda','Beranda')).document;
 assert.deepEqual([...home.querySelectorAll('#programs .card-title')].map(node=>node.textContent),main);
 assert.deepEqual([...home.querySelectorAll('#featured-programs .card-title')].map(node=>node.textContent),featured);
 const registration=parseHTML(markup('pendaftaran','Pendaftaran')).document;
 assert.equal(registration.querySelector('#registration-form').hasAttribute('hidden'),true);
 assert.equal(registration.querySelectorAll('[data-registration-step]').length,3);
 assert.equal(registration.querySelectorAll('[data-jenjang] input').length,0);
 assert.match(registration.querySelector('.registration-bank a').href,/wa\.me\/6285720000265/);
});

test('published levels render as compact cards; TikTok requires a valid configured handle',()=>{
 const {document}=parseHTML(Program({ levels:[{title:'Jenjang Baru',description:'Deskripsi singkat'}] }));
 assert.deepEqual([...document.querySelectorAll('.jenjang-card strong')].map(node=>node.textContent),['Jenjang Baru']);
 assert.doesNotMatch(Footer(),/aria-label="TikTok"/);
 assert.match(Footer({ tiktok:tiktokHandle('https://www.tiktok.com/@pondok_uji') }),/https:\/\/www\.tiktok\.com\/@pondok_uji/);
 assert.throws(()=>tiktokHandle('https://tiktok.com.example/@orang'));
});

test('contact, footer, WhatsApp and maps consistently use the supplied Bogor address and active number',()=>{
 const html=markup('kontak','Kontak'),contact=parseHTML(html).document;
 const footer=Footer(),whatsapp=WhatsAppButton();
 for(const part of [html,footer]){
  assert.match(part,/0857-2000-0265/);assert.match(part,/Gunung Picung/);assert.match(part,/003\/003/);
  assert.doesNotMatch(part,/Ciwidey|Kab\. Bandung|Pesantren Raya|0812-3456-7890/);
 }
 assert.match(html,/tel:\+6285720000265/);assert.match(footer,/tel:\+6285720000265/);
 assert.match(whatsapp,/wa\.me\/6285720000265/);assert.match(html,/wa\.me\/6285720000265/);
 const embed=new URL(contact.querySelector('iframe').getAttribute('src'));
 assert.equal(embed.hostname,'www.google.com');assert.equal(embed.searchParams.get('q'),pondok.pondokContact.address);assert.equal(embed.searchParams.get('output'),'embed');
 const link=new URL(contact.querySelector('.contact-map-link a').getAttribute('href'));
 assert.equal(link.searchParams.get('api'),'1');assert.equal(link.searchParams.get('query'),pondok.pondokContact.address);
});
