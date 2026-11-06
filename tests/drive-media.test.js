import test from 'node:test';
import assert from 'node:assert/strict';
import { createDriveMedia,photoAssetId } from '../src/drive-media.js';
import { createSupabaseStore } from '../src/admin-data.js';
const client={auth:{getSession:async()=>({data:{session:{access_token:'fixture-session'}}})}};
test('one upload sends one HD photo and a hosting-only thumbnail with a stable source ID',async()=>{
  const requests=[];
  const fetcher=async(url,options)=>{const body=JSON.parse(options.body);requests.push(body);assert.equal(options.headers.Authorization,'Bearer fixture-session');return{ok:true,json:async()=>({ok:true,variant:body.variant,sha256:body.file.sha256,asset:{id:body.assetId,complete:true,full:'/api/media-image.php?full',thumbnail:'/api/media-image.php?thumbnail'}})};};
  const api=createDriveMedia(client,fetcher);
  const original=new File(['original'],'foto.png',{type:'image/png'});
  const file=new File(['HD'],'foto.webp',{type:'image/webp'});
  const thumbnail=new File(['small'],'foto.webp',{type:'image/webp'});
  const photo=await api.upload({file,original,thumbnail});await api.upload({file,original,thumbnail});
  assert.equal(photo.complete,true);
  assert.equal(requests.length,2);
  assert.deepEqual(requests.map(row=>row.variant),['full','full']);
  assert.equal(new Set(requests.map(row=>row.assetId)).size,1);
  assert.equal(requests[0].layout,'single-file');
  assert.equal(requests[0].file.bytes,2);
  assert.equal(Buffer.from(requests[0].file.data,'base64').toString(),'HD');
  assert.equal(requests[0].thumbnail.bytes,5);
  assert.equal(requests[0].sourceSha256.length,64);
  assert.match(photoAssetId('a'.repeat(64)),/^[a-f0-9-]{14}4[a-f0-9-]{4}[89ab]/);
});
test('Drive refuses missing sessions or mismatched upload receipts',async()=>{
  await assert.rejects(createDriveMedia({auth:{getSession:async()=>({data:{}})}},()=>{throw Error('Must not fetch');}).list(),/Masuk kembali/);
  const api=createDriveMedia(client,async()=>({ok:true,json:async()=>({ok:true,variant:'other',sha256:'bad'})}));
  await assert.rejects(api.upload({file:new File(['photo'],'photo.png',{type:'image/png'})}),/Tanda terima/);
});

test('re-encoded uploads reuse the canonical photo only when the source hash and asset ID match',async()=>{
  const file=new File(['HD'],'foto.webp',{type:'image/webp'});
  const fetcher=async(url,options)=>{
    const body=JSON.parse(options.body);
    return {ok:true,json:async()=>({
      ok:true,variant:'full',reused:true,sourceSha256:body.sourceSha256,sha256:'b'.repeat(64),
      asset:{id:body.assetId,complete:true,full:'/full',thumbnail:'/thumbnail'}
    })};
  };
  assert.equal((await createDriveMedia(client,fetcher).upload({file})).complete,true);
  const forged=async(url,options)=>{
    const response=await fetcher(url,options);
    const value=await response.json();
    return {ok:true,json:async()=>({...value,sourceSha256:'0'.repeat(64)})};
  };
  await assert.rejects(createDriveMedia(client,forged).upload({file}),/Tanda terima/);
});
test('news saves reuse Drive selections without uploading to Supabase Storage',async()=>{
  let payload,uploads=0;
  const db={from(){return{insert(values){payload=values;return this;},select(){return this;},single:async()=>({data:{id:'news'}})};}};
  const store=createSupabaseStore(db,{role:'admin',userId:'admin',media:{upload:async()=>{uploads++;throw Error('Unexpected upload');}}});
  await store.put('berita',{judul:'Kabar pondok',isi:'Isi berita',status:'published'},null,null,{drivePhoto:{full:'/api/media-image.php?full',thumbnail:'/api/media-image.php?thumb'}});
  assert.equal(uploads,0);assert.equal(payload.gambar_url,'/api/media-image.php?full');
});
