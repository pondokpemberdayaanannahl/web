import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { loadLatestStories, storyCard, initHomeStories } from '../src/home-stories.js';

const rows = {
  berita: [{ id:'n1',judul:'Berita terbaru',isi:'Cerita kegiatan pondok.',status:'published',dibuat_pada:'2026-10-30T12:00:00Z',gambar_url:'/full.jpg',thumbnail_url:'/small.jpg' },{ id:'n2',judul:'Berita lama',dibuat_pada:'2026-09-01T00:00:00Z' }],
  galeri_foto: [{ id:'p1',judul:'Foto terbaru',caption:'Kegiatan santri',gambar_url:'/photo.jpg',dibuat_pada:'2026-10-31T12:00:00Z' },{ id:'p2',judul:'Foto kemarin',gambar_url:'/photo2.jpg',dibuat_pada:'2026-10-29T12:00:00Z' }],
  galeri_video: [{ id:'v1',judul:'Video terbaru',youtube_id:'abcdefghijk',dibuat_pada:'2026-10-31T13:00:00Z' },{id:'bad',judul:'Tautan rusak',youtube_id:'invalid',dibuat_pada:'2026-10-31T14:00:00Z'}],
};
function client({ fail=null, wait=null }={}) {
  const requests=[];
  return { requests,from(table){const request={table};requests.push(request);return {
    select(fields){request.fields=fields;return this;},eq(key,value){request.eq=[key,value];return this;},is(key,value){request.is=[key,value];return this;},order(key,options){request.order=[key,options];return this;},
    async limit(limit){request.limit=limit;if(wait)await wait;return table===fail?{data:null,error:new Error('private diagnostic')}:{data:rows[table],error:null};},
  };} };
}

test('home stories merge all three sources by date, show four, and query published non-archived news only',async()=>{
  const c=client();const result=await loadLatestStories(c);
  assert.deepEqual(result.items.map(row=>row.key),['video:v1','foto:p1','berita:n1','foto:p2']);
  assert.equal(result.unavailable,false);assert.equal(c.requests.length,3);
  assert.deepEqual(c.requests[0].eq,['status','published']);assert.deepEqual(c.requests[0].is,['deleted_at',null]);
  assert.ok(c.requests.every(request=>request.limit===4&&request.order[0]==='dibuat_pada'&&!request.order[1].ascending));
});

test('unavailable sources preserve remaining content and expose no raw error details',async()=>{
  const result=await loadLatestStories(client({fail:'berita'}));
  assert.equal(result.unavailable,true);assert.ok(result.items.length>0);assert.ok(result.items.every(row=>row.kind!=='berita'));
  assert.deepEqual(await loadLatestStories(null),{items:[],unavailable:true});
});

test('story cards use large images and escape titles and captions',()=>{
  const html=storyCard({...rows.berita[0],kind:'berita',key:'berita:n1',judul:'<script>bad()</script>',isi:'Aman **dibaca**'});
  const {document}=parseHTML(html);
  assert.equal(document.querySelector('img').getAttribute('src'),'/full.jpg');
  assert.equal(document.querySelector('script'),null);assert.match(document.querySelector('h3').textContent,/<script>/);
  assert.equal(document.querySelectorAll('[data-story]').length,2);
});

test('news, photo and video open from their cards and closing removes video playback',async()=>{
  const oldDocument=globalThis.document;
  const {document,window}=parseHTML('<html><body><p id="home-stories-status"></p><div id="home-stories-grid"></div><dialog id="story-dialog"><h2 id="story-dialog-title"></h2><button data-story-close>Close</button><div id="story-dialog-body"></div></dialog></body></html>');
  globalThis.document=document;
  const dialog=document.getElementById('story-dialog'),body=document.getElementById('story-dialog-body');
  dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
  try{
    await initHomeStories(client());
    assert.equal(document.querySelectorAll('.story-card').length,4);
    for(const key of ['berita:n1','foto:p1','video:v1']){
      document.querySelector(`[data-story="${key}"]`).dispatchEvent(new window.Event('click',{bubbles:true}));
      assert.equal(dialog.open,true);
      if(key.startsWith('video'))assert.match(body.querySelector('iframe').getAttribute('src'),/^https:\/\/www.youtube-nocookie.com\/embed\/abcdefghijk$/);
      else assert.ok(body.querySelector('img'));
      dialog.close();assert.equal(body.innerHTML,'');assert.notEqual(document.body.style.overflow,'hidden');
    }
  }finally{globalThis.document=oldDocument;}
});

test('an old stories request cannot populate a page after navigation',async()=>{
  const oldDocument=globalThis.document;
  const {document}=parseHTML('<html><body><div id="home-stories-grid"></div><p id="home-stories-status"></p><dialog id="story-dialog"></dialog></body></html>');
  globalThis.document=document;let finish;
  try{
    const loading=initHomeStories(client({wait:new Promise(resolve=>{finish=resolve;})}));
    document.getElementById('home-stories-grid').remove();finish();await loading;
    assert.equal(document.getElementById('home-stories-status').textContent,'');
  }finally{globalThis.document=oldDocument;}
});
