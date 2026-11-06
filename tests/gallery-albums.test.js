import test from 'node:test';
import assert from 'node:assert/strict';
import { createGalleryAlbumStore, defaultGalleryAlbums, normalizeGalleryAlbum } from '../src/gallery-albums.js';
import { galleryAlbumCard } from '../src/gallery-view.js';
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};

test('public initial albums contain the existing 22 photos, grouped with context and real covers',async()=>{
  const albums=defaultGalleryAlbums();assert.equal(albums.length,4);assert.equal(albums.reduce((n,album)=>n+album.photos.length,0),22);
  assert.equal(new Set(albums.flatMap(album=>album.photos.map(photo=>photo.gambar_url))).size,22);
  for(const album of albums){assert.ok(album.deskripsi);assert.ok(album.photos.some(photo=>photo.id===album.sampul_id));normalizeGalleryAlbum(album);assert.match(galleryAlbumCard(album),/-480\.jpg/);}
});

test('albums create, edit, reorder, change cover, filter, archive and restore through a shared demo store',async()=>{
  const local=storage(),admin=createGalleryAlbumStore(null,{storage:local}),publicStore=createGalleryAlbumStore(null,{storage:local,publicOnly:true});
  const values={...defaultGalleryAlbums()[0],judul:'Kegiatan bersama',status:'draft'};
  delete values.id;
  let row=await admin.save(values);assert.equal(row.revision,1);assert.equal((await publicStore.list()).count,4);
  const reversed=[...row.photos].reverse();row=await admin.save({...row,photos:reversed,sampul_id:reversed[0].id,status:'published'},row);
  assert.equal(row.revision,2);assert.equal(row.sampul_url,reversed[0].gambar_url);assert.equal((await publicStore.get(row.id)).photos[0].id,reversed[0].id);
  assert.equal((await admin.list({search:'bersama'})).count,1);
  await assert.rejects(admin.save({...row,judul:'Konflik'},{...row,revision:1}),/berubah/);
  row=await admin.archive(row);assert.equal((await publicStore.list()).count,4);assert.equal((await admin.list({status:'trash'})).count,1);
  row=await admin.archive(row,false);assert.equal(row.status,'draft');await assert.rejects(publicStore.get(row.id),/tidak tersedia/);
  await assert.rejects(createGalleryAlbumStore(null,{storage:local,role:'editor'}).save(values),/Hanya admin/);
});

test('invalid URLs, duplicate photos, invalid covers, oversized captions and empty published albums are rejected',()=>{
  const album=defaultGalleryAlbums()[0];
  assert.throws(()=>normalizeGalleryAlbum({...album,photos:[]}),/minimal satu foto/);
  assert.throws(()=>normalizeGalleryAlbum({...album,sampul_id:'unknown'}),/sampul/);
  assert.throws(()=>normalizeGalleryAlbum({...album,photos:[album.photos[0],album.photos[0]]}),/ganda/);
  assert.throws(()=>normalizeGalleryAlbum({...album,photos:[{...album.photos[0],gambar_url:'javascript:alert(1)'}]}),/tidak valid/);
  assert.throws(()=>normalizeGalleryAlbum({...album,photos:[{...album.photos[0],caption:'x'.repeat(801)}]}),/keterangan/);
  const card=galleryAlbumCard({...album,judul:'<script>unsafe</script>',deskripsi:'<img onerror=bad()>'});
  assert.ok(!card.includes('<script>'));assert.ok(card.includes('&lt;script&gt;'));
});

test('live album lists request summaries and do not report an empty gallery when count headers are unavailable',async()=>{
  let fields='';const data=defaultGalleryAlbums().map(({photos,...row})=>row);
  const query={select(value){fields=value;return this;},order(){return this;},is(){return this;},eq(){return this;},async range(){return {data,count:null,error:null};}};
  const store=createGalleryAlbumStore({from:()=>query},{publicOnly:true});const result=await store.list();
  assert.equal(result.data.length,4);assert.ok(result.count>=4);assert.ok(!fields.split(',').includes('photos'));
});
