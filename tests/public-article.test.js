import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {photos} from '../src/data/photos.js';
import {categoryCards} from '../src/components/category-cards.js';
import {renderBody,plainText,safeUrl} from '../src/content-format.js';

async function fixture(){
  const {document,window}=parseHTML('<html><head></head><body><button id="trigger">Baca berita</button></body></html>');
  const rows=[{id:'video',judul:'Video santri',kategori:'Akademik',isi:'Cerita kegiatan santri.',youtube_id:'M7lc1UVf-VE',dibuat_pada:'2026-11-07T00:00:00Z'}, {id:'foto',judul:'Foto kegiatan',kategori:'Akademik',isi:'Cerita lengkap kegiatan.',gambar_url:'/media/test.jpg',dibuat_pada:'2026-11-06T00:00:00Z'}];
  const query={select(){return this;},eq(){return this;},is(){return this;},order(){return this;},then(resolve){resolve({data:rows,error:null});}};
  const context={document,window:{},photos,categoryCards,renderBody,plainText,safeUrl,supabase:{from:()=>query},console};
  const source=readFileSync(new URL('../src/pages/berita.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replaceAll('export ','');
  vm.runInNewContext(source,context);
  document.body.insertAdjacentHTML('beforeend',context.Berita());
  const modal=document.getElementById('article-modal'),body=document.getElementById('article-modal-body'),trigger=document.getElementById('trigger');
  let opened=0,focusReturns=0;
  Object.defineProperty(document,'activeElement',{value:trigger,configurable:true});
  trigger.focus=()=>{focusReturns++;};
  modal.open=false;modal.showModal=()=>{modal.open=true;opened++;};modal.close=()=>{modal.open=false;modal.dispatchEvent(new window.Event('close'));};
  await context.window.initNewsFilter();
  const cards=[...document.querySelectorAll('.news-card[data-slug]')];
  return {document,window,modal,body,context,cards,opened:()=>opened,focusReturns:()=>focusReturns};
}

test('article dialog keeps a persistent close control, resets related articles to their top, and stops video playback on close',async()=>{
  const ui=await fixture();ui.document.body.style.overflow='auto';
  ui.context.window.showArticle(ui.cards[0].dataset.slug);
  assert.equal(ui.modal.open,true);assert.equal(ui.opened(),1);
  assert.ok(ui.modal.querySelector('.article-modal-header [aria-label="Tutup berita"]'));
  assert.match(ui.body.querySelector('iframe').src,/youtube-nocookie\.com\/embed\/M7lc1UVf-VE/);
  ui.body.scrollTop=500;
  ui.context.window.showArticle(ui.cards[1].dataset.slug);
  assert.equal(ui.opened(),1);assert.equal(ui.body.scrollTop,0);assert.equal(ui.body.querySelector('iframe'),null);
  assert.match(ui.body.textContent,/Cerita lengkap kegiatan/);
  ui.context.window.closeArticle();assert.equal(ui.modal.open,false);assert.equal(ui.body.innerHTML,'');
  assert.equal(ui.document.body.style.overflow,'auto');assert.equal(ui.focusReturns(),1);
});

test('Escape closes the article and releases the page scroll lock',async()=>{
  const ui=await fixture();ui.context.window.showArticle(ui.cards[0].dataset.slug);
  ui.modal.dispatchEvent(new ui.window.Event('cancel',{cancelable:true}));
  assert.equal(ui.modal.open,false);assert.equal(ui.modal.classList.contains('open'),false);assert.equal(ui.body.innerHTML,'');
  assert.notEqual(ui.document.body.style.overflow,'hidden');
});
