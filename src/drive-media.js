const endpoint = '/api/media.php';
export function photoAssetId(hex) {
  if (!/^[a-f0-9]{64}$/.test(hex)) throw new Error('Hash foto tidak sesuai.');
  const value = hex.slice(0,12)+'4'+hex.slice(13,16)+(8+(parseInt(hex[16],16)&3)).toString(16)+hex.slice(17,32);
  return `${value.slice(0,8)}-${value.slice(8,12)}-${value.slice(12,16)}-${value.slice(16,20)}-${value.slice(20)}`;
}
export async function imagePart(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
  let text = '';
  for (let at=0;at<bytes.length;at+=16384) text += String.fromCharCode(...bytes.subarray(at,at+16384));
  return {name:file.name,mime:file.type,bytes:bytes.length,sha256,data:btoa(text)};
}
export function createDriveMedia(client, fetcher = fetch) {
  const request = async (query = '', body = null) => {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Masuk kembali sebagai pengurus untuk membuka Drive.');
    const response = await fetcher(`${endpoint}${query}`, {method:body ? 'POST' : 'GET',headers:{'X-Annahl-Media':'1',Authorization:`Bearer ${data.session.access_token}`,...(body ? {'Content-Type':'application/json'} : {})},...(body ? {body:JSON.stringify(body)} : {}),cache:'no-store'});
    let reply; try { reply = await response.json(); } catch { throw new Error('Penghubung foto Drive belum tersedia di hosting.'); }
    if (!response.ok || reply.ok !== true) throw new Error(reply.message || 'Perpustakaan Drive belum dapat dibuka.');
    return reply;
  };
  return {
    async list({search='',cursor=''}={}) { return request('?'+new URLSearchParams({action:'list',search,cursor})); },
    async status() { return request('?action=status'); },
    async upload({file,original=file,thumbnail=file,folder='Unggahan pengurus',onProgress=()=>{}}) {
      const source = await imagePart(original);
      const id = photoAssetId(source.sha256);
      let photo;
      for (const [variant,part] of [['original',source],['full',await imagePart(file)],['thumbnail',await imagePart(thumbnail || file)]]) {
        onProgress({original:'Menyimpan foto asli ke Drive…',full:'Menyimpan versi website…',thumbnail:'Menyiapkan pratinjau…'}[variant]);
        const reply = await request('',{assetId:id,variant,name:original.name,folder,file:part});
        if (reply.variant !== variant || reply.sha256 !== part.sha256 || reply.asset?.id !== id) throw new Error('Tanda terima foto belum sesuai. Coba simpan kembali.');
        photo = reply.asset;
        if (variant === 'original' && photo.complete && photo.full && photo.thumbnail) return photo;
      }
      if (!photo?.complete || !photo.full || !photo.thumbnail) throw new Error('Drive belum mengonfirmasi semua versi foto. Coba simpan kembali.');
      return photo;
    },
  };
}
