import { optimizeImage } from './editor-tools.js';

// Runs only after an authenticated admin chooses the migration action.
// Old objects are retained for history and rollback; content updates still use CAS.
export async function migrateLegacyPhotos(store, client, onProgress=()=>{}) {
  const host = new URL(client.supabaseUrl).hostname;
  const jobs=[];
  for (const [type,status] of [['berita',''],['berita','trash'],['foto','']]) {
    for (let page=1;page<=200;page++) {
      const result=await store.list(type,{page,limit:50,status});
      for(const row of result.data) {
        let url;try{url=new URL(row.gambar_url);}catch{continue;}
        if(url.protocol==='https:' && url.hostname===host && /^\/storage\/v1\/object\/public\/(berita-gambar|galeri-foto)\//.test(url.pathname)) jobs.push({type,row,url:url.href});
      }
      if(page*50>=result.count || !result.data.length)break;
      if(page===200)throw Error('Jumlah foto terlalu besar untuk satu proses. Hubungi admin proyek.');
    }
  }
  let copied=0;
  for(const {type,row,url} of jobs) {
    onProgress(`Menyalin ${copied+1}/${jobs.length}: ${row.judul}`);
    const response=await fetch(url,{redirect:'error'});
    if(!response.ok)throw Error(`Foto lama belum dapat diambil: ${row.judul}. ${copied} foto sebelumnya sudah diproses.`);
    const blob=await response.blob();
    if(blob.size>12*1024*1024 || !['image/jpeg','image/png','image/webp','image/gif'].includes(blob.type))throw Error('Foto lama melebihi batas atau formatnya tidak didukung.');
    const name=decodeURIComponent(new URL(url).pathname.split('/').pop()).replace(/[/\\\x00-\x1f]/g,'_').slice(-180);
    const original=new File([blob],name,{type:blob.type}),image=await optimizeImage(original);
    await store.put(type,{},image.file,row,{original,thumbnail:image.thumbnail,onProgress});
    copied++;
  }
  return {copied,total:jobs.length};
}
