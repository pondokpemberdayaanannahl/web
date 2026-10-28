import test from 'node:test';
import assert from 'node:assert/strict';
import { createDriveMedia,photoAssetId } from '../src/drive-media.js';
import { createSupabaseStore } from '../src/admin-data.js';
const client={auth:{getSession:async()=>({data:{session:{access_token:'fixture-session'}}})}};
test('Drive uploads acknowledge originals and two renditions, with stable retry IDs',async()=>{
  const requests=[];
  const fetcher=async(url,options)=>{const body=JSON.parse(options.body);requests.push(body);assert.equal(options.headers.Authorization,'Bearer fixture-session');return{ok:true,json:async()=>({ok:true,variant:body.variant,sha256:body.file.sha256,asset:{id:body.assetId,complete:body.variant==='thumbnail',full:'/api/media-image.php?full',thumbnail:'/api/media-image.php?thumbnail'}})};};
  const api=createDriveMedia(client,fetcher),file=new File(['original'],'foto.png',{type:'image/png'});
  const photo=await api.upload({file});await api.upload({file});
  assert.equal(photo.complete,true);
  assert.deepEqual(requests.slice(0,3).map(row=>row.variant),['original','full','thumbnail']);
  assert.equal(new Set(requests.map(row=>row.assetId)).size,1);
  assert.equal(requests[0].file.bytes,8);
  assert.match(photoAssetId('a'.repeat(64)),/^[a-f0-9-]{14}4[a-f0-9-]{4}[89ab]/);
});
test('Drive refuses missing sessions or mismatched upload receipts',async()=>{
  await assert.rejects(createDriveMedia({auth:{getSession:async()=>({data:{}})}},()=>{throw Error('Must not fetch');}).list(),/Masuk kembali/);
  const api=createDriveMedia(client,async()=>({ok:true,json:async()=>({ok:true,variant:'other',sha256:'bad'})}));
  await assert.rejects(api.upload({file:new File(['photo'],'photo.png',{type:'image/png'})}),/Tanda terima/);
});
test('news saves reuse Drive selections without uploading to Supabase Storage',async()=>{
  let payload,uploads=0;
  const db={from(){return{insert(values){payload=values;return this;},select(){return this;},single:async()=>({data:{id:'news'}})};}};
  const store=createSupabaseStore(db,{role:'admin',userId:'admin',media:{upload:async()=>{uploads++;throw Error('Unexpected upload');}}});
  await store.put('berita',{judul:'Kabar pondok',isi:'Isi berita',status:'published'},null,null,{drivePhoto:{full:'/api/media-image.php?full',thumbnail:'/api/media-image.php?thumb'}});
  assert.equal(uploads,0);assert.equal(payload.gambar_url,'/api/media-image.php?full');
});
