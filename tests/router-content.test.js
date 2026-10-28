import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const wait=()=>new Promise(resolve=>setTimeout(resolve,8));
test('lazy page navigation ignores old responses and offers retry after a failed page download',async()=>{
  const { document,window }=parseHTML('<html><body><main id="page-content"></main></body></html>');
  window.matchMedia=()=>({matches:true});window.scrollTo=()=>{};window.HTMLElement.prototype.focus=()=>{};
  const code=readFileSync(new URL('../src/router.js',import.meta.url),'utf8').replace('export class','class');
  const context={document,window,setTimeout,clearTimeout,requestAnimationFrame:callback=>callback(),console};
  vm.runInNewContext(code+';globalThis.Router=Router;',context);
  const router=new context.Router([]);
  let resolveSlow;
  router.render({path:'/',component:()=>new Promise(resolve=>{resolveSlow=resolve})});
  await wait();
  router.render({path:'/program',component:async()=>'<h1>Program terbaru</h1><form><input id="nama"></form>'});
  await wait(); document.getElementById('nama').value='Isian pengunjung';
  resolveSlow('<h1>Halaman lama</h1>');await wait();
  assert.match(document.getElementById('page-content').textContent,/Program terbaru/);
  assert.equal(document.getElementById('nama').value,'Isian pengunjung');
  let failed=true;
  router.render({path:'/tentang',component:async()=>{if(failed)throw new Error('offline');return '<h1>Tentang pondok</h1>'}});
  await wait(); assert.match(document.getElementById('page-content').textContent,/belum dapat dibuka/);
  failed=false;document.getElementById('route-retry').dispatchEvent(new window.Event('click'));await wait();
  assert.match(document.getElementById('page-content').textContent,/Tentang pondok/);
});

