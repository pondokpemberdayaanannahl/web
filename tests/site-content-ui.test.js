import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import * as content from '../src/site-content.js';
import { createSiteContentStore } from '../src/site-content-store.js';
import { escapeHtml as esc } from '../src/content-format.js';
import { photos,photoThumbnail } from '../src/data/photos.js';

const code = readFileSync(new URL('../src/site-content-admin.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replace('export function','function');
const template = '<section class="hero"><h1>Kabar pondok</h1><p>Pengantar website pondok.</p></section><section><h2>Program pendidikan</h2><p>Belajar dengan amanah dan kasih sayang.</p><img src="/media/awal.jpg" alt="Foto kegiatan"></section>';
function fixture() {
  const { document,window }=parseHTML('<html><body><main id="host"></main></body></html>');
  const saved=new Map(), storage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
  const messages=[],host=document.getElementById('host');
  const context={ ...content,createContentCatalog:html=>content.createContentCatalog(html,document),renderSiteContent:(html,value)=>content.renderSiteContent(html,value,document),createSiteContentStore,esc,photos,photoThumbnail,document,window,sessionStorage:storage,localStorage:storage,location:{origin:'https://example.org'},pageTemplate:async()=>template,baseCss:'/index.css',componentsCss:'/components.css',pagesCss:'/pages.css',URL,confirm:()=>true,console,Date,structuredClone };
  vm.runInNewContext(code,context);
  const manager=context.mountWebsiteManager({host,client:null,demo:true,userId:'admin-test',role:'admin',notify:(message,error)=>messages.push({message,error})});
  const $=selector=>host.querySelector(selector);
  const tick=()=>new Promise(resolve=>setImmediate(resolve));
  async function click(selector) { const node=$(selector);assert.ok(node,selector);node.dispatchEvent(new window.Event('click',{bubbles:true}));await tick();await tick(); }
  return {document,host,window,saved,storage,messages,manager,$,click,tick};
}

test('website manager edits a section, preserves form values, saves a draft, previews in a sandbox, and publishes with acknowledgement',async()=>{
  const ui=fixture();
  try {
    assert.equal(ui.host.querySelectorAll('[data-cms-page]').length,9);
    await ui.manager.open('beranda');
    for(const dialog of ui.host.querySelectorAll('dialog')){dialog.showModal=()=>{dialog.open=true};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new ui.window.Event('close'))};}
    await ui.click('[data-cms-block]');
    const title=ui.$('#cms-fields [data-cms-field]');
    title.value='Cerita baru dari pondok';title.dispatchEvent(new ui.window.Event('input',{bubbles:true}));
    assert.equal(ui.manager.dirty,true);
    assert.ok([...ui.saved.keys()].some(key=>key.includes('admin-test:beranda')));
    await ui.click('[data-cms-action="close-editor"]');
    assert.match(ui.$('#cms-blocks').textContent,/Cerita baru dari pondok/);
    await ui.click('[data-cms-action="preview"]');
    assert.equal(ui.$('#cms-preview-frame').getAttribute('sandbox'),'');
    assert.match(ui.$('#cms-preview-frame').srcdoc,/Cerita baru dari pondok/);
    await ui.click('[data-cms-action="draft"]');
    const stored=createSiteContentStore(null,{role:'admin',storage:ui.storage});
    assert.equal((await stored.load('beranda')).published,null);
    assert.equal(ui.manager.dirty,false);
    await ui.click('[data-cms-action="publish"]');
    const published=(await stored.load('beranda')).published;
    assert.ok(Object.values(published.content.values).includes('Cerita baru dari pondok'));
    assert.ok(ui.messages.some(item=>item.message.includes('demo diperbarui')));
  } finally {ui.manager.dispose();}
});

test('footer and contact use the supplied social accounts with safe new-tab links',()=>{
  const footer=readFileSync(new URL('../src/components/footer.js',import.meta.url),'utf8');
  const contact=readFileSync(new URL('../src/pages/kontak.js',import.meta.url),'utf8');
  for(const source of [footer,contact]){
    for(const account of ['www.instagram.com/annahl.official','youtube.com/@ppuan-nahl4784','www.facebook.com/share/1DjhtbZ3na/']) assert.ok(source.includes(account));
    assert.ok(source.includes('rel="noopener noreferrer"'));
  }
  assert.ok(!footer.includes('aria-label="Twitter"'));
});

test('admin can remove and restore informational sections without deleting forms or hero',async()=>{
  const ui=fixture();
  try {
    await ui.manager.open('beranda');
    assert.equal(ui.host.querySelectorAll('[data-cms-remove]').length,1);
    await ui.click('[data-cms-remove]');
    assert.equal(ui.manager.dirty,true);
    await ui.click('[data-cms-action="publish"]');
    const stored=createSiteContentStore(null,{role:'admin',storage:ui.storage});
    assert.equal((await stored.load('beranda')).published.content.hidden.length,1);
    await ui.click('[data-cms-restore]');
    await ui.click('[data-cms-action="publish"]');
    assert.equal((await stored.load('beranda')).published.content.hidden.length,0);
  } finally { ui.manager.dispose(); }
});
