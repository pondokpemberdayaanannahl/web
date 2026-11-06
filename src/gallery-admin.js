import { createGalleryAlbumStore, normalizeGalleryAlbum, GALLERY_CATEGORIES, ALBUM_PAGE_SIZE, MAX_ALBUM_PHOTOS } from './gallery-albums.js';
import { galleryAlbumCard, createAlbumViewer } from './gallery-view.js';
import { escapeHtml as esc } from './content-format.js';
import { contentUrl } from './site-content.js';
import { loadPhotoLibrary } from './photo-library.js';
import { createDriveMedia } from './drive-media.js';
import { selectDrivePhoto } from './drive-picker.js';
import { optimizeImage } from './editor-tools.js';

export function mountGalleryManager({host,client,demo,role,notify,onChange=()=>{}}) {
  const store=createGalleryAlbumStore(client,{storage:demo ? sessionStorage : null,role});
  const $=selector=>host.querySelector(selector);
  let rows=[],count=0,page=1,sequence=0,disposed=false,busy=false,dirty=false,edited=null,working=null,searchTimer;
  let library=[],pickerRows=[],pickerPage=1,pickerCount=0,pickerSequence=0;
  const pending=new Map(),selected=new Map();
  host.innerHTML=`<div class="album-manager-tools"><input type="search" data-album-search placeholder="Cari album kegiatan…" aria-label="Cari album"><select data-album-category aria-label="Kategori album"><option value="">Semua kategori</option>${GALLERY_CATEGORIES.map(value=>`<option>${value}</option>`).join('')}</select><select data-album-status aria-label="Status album"><option value="">Semua aktif</option><option value="published">Terbit</option><option value="draft">Draft</option><option value="trash">Arsip</option></select><button type="button" class="button secondary compact" data-album-refresh>Muat ulang</button><button type="button" class="button compact" data-album-new ${role==='admin' ? '' : 'hidden'}>＋ Buat album</button></div><p class="album-manager-message" data-album-list-message role="status"></p><div class="album-manager-content"><div class="album-grid" data-album-grid></div></div><div class="pagination"><span data-album-page></span><div><button type="button" class="button secondary compact" data-album-page-prev aria-label="Halaman album sebelumnya">←</button><button type="button" class="button secondary compact" data-album-page-next aria-label="Halaman album berikutnya">→</button></div></div>
  <dialog class="album-editor" aria-labelledby="album-editor-title"><form data-album-form><div class="dialog-header"><div><span class="eyebrow">CERITA DALAM FOTO</span><h2 id="album-editor-title">Buat album</h2></div><button type="button" class="icon-button" data-album-editor-close aria-label="Tutup editor album">×</button></div><div class="album-editor-form"><div class="album-editor-intro"><div class="album-fields"><label for="album-title-input">Nama kegiatan / judul album</label><input id="album-title-input" name="judul" required maxlength="140" placeholder="Contoh: Panen perdana bersama santri"><div class="album-field-pair"><div><label for="album-category-input">Kategori</label><select id="album-category-input" name="kategori">${GALLERY_CATEGORIES.map(value=>`<option>${value}</option>`).join('')}</select></div><div><label for="album-date-input">Tanggal kegiatan <span class="muted">(opsional)</span></label><input id="album-date-input" type="date" name="tanggal"></div></div><label for="album-context-input">Cerita / konteks kegiatan</label><textarea id="album-context-input" name="deskripsi" maxlength="4000" rows="4" placeholder="Ceritakan kegiatannya, siapa yang ikut, dan apa yang dipelajari…"></textarea></div><aside class="album-cover-preview"><img data-album-cover-preview alt="Pratinjau sampul album"><div><strong data-album-title-preview></strong><p data-album-context-preview></p></div></aside></div><div class="album-add-tools"><strong data-album-photo-total>0 foto</strong><button type="button" class="button secondary compact" data-album-pick-local>Pilih beberapa foto</button><button type="button" class="button secondary compact" data-album-pick-drive>Dari Drive</button><label class="button secondary compact" ${demo ? 'hidden' : ''}>Unggah foto<input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple data-album-upload></label></div><p class="muted">Urutkan foto dengan tombol panah, pilih sampul, dan tambahkan keterangan per foto. Maksimal ${MAX_ALBUM_PHOTOS} foto.${demo ? ' Mode demo memakai dokumentasi pondok.' : ''}</p><div class="album-photo-list" data-album-photo-list></div></div><div class="dialog-footer"><p class="form-message" data-album-message role="status"></p><button type="button" class="button secondary" data-album-preview>Pratinjau</button><button type="button" class="button secondary" data-album-save-draft>Simpan draft</button><button type="submit" class="button">Terbitkan album</button></div></form></dialog>
  <dialog class="album-picker" aria-labelledby="album-picker-title"><div class="dialog-header"><div><span class="eyebrow">PILIH SECARA VISUAL</span><h2 id="album-picker-title">Tambahkan foto ke album</h2></div><button type="button" class="icon-button" data-album-picker-close aria-label="Tutup pilihan foto album">×</button></div><div class="album-picker-body"><div class="album-picker-tools"><input type="search" data-album-picker-search placeholder="Cari foto kegiatan…" aria-label="Cari foto untuk album"><select data-album-picker-source aria-label="Sumber foto album"><option value="pondok">Dokumentasi pondok</option><option value="unggahan">Foto unggahan</option></select></div><p data-album-picker-status role="status"></p><div class="album-picker-grid" data-album-picker-grid></div><div class="pagination"><span data-album-picker-page></span><div><button type="button" class="button secondary compact" data-album-picker-prev>←</button><button type="button" class="button secondary compact" data-album-picker-next>→</button></div></div></div><div class="dialog-footer"><span data-album-selected>0 foto dipilih</span><button type="button" class="button" data-album-add-selected>Tambahkan foto</button></div></dialog>`;
  const editor=$('.album-editor'),picker=$('.album-picker'),form=$('[data-album-form]'),viewer=createAlbumViewer(host);
  const message=(text,error=false)=>{const node=$('[data-album-message]');node.textContent=text;node.dataset.state=error ? 'error' : 'info';};
  function setBusy(value) { busy=value;editor.querySelectorAll('input,textarea,select,button').forEach(control=>{control.disabled=value;}); }
  function clearPending() { for(const value of pending.values())URL.revokeObjectURL(value.preview);pending.clear(); }
  function captureFields() {
    if(!working)return;
    for(const key of ['judul','kategori','tanggal','deskripsi'])working[key]=form.elements.namedItem(key).value;
  }
  function previewCover() {
    if(!working)return;
    const photo=working.photos.find(item=>item.id===working.sampul_id)||working.photos[0];
    const image=$('[data-album-cover-preview]');image.hidden=!photo;
    if(photo)image.src=pending.get(photo.id)?.preview || contentUrl(photo.gambar_url,'image');else image.removeAttribute('src');
    $('[data-album-title-preview]').textContent=working.judul || 'Judul album Anda';
    $('[data-album-context-preview]').textContent=working.deskripsi || 'Cerita kegiatan akan muncul di sini.';
  }
  function renderPhotos() {
    $('[data-album-photo-total]').textContent=`${working.photos.length} / ${MAX_ALBUM_PHOTOS} foto`;
    $('[data-album-photo-list]').innerHTML=working.photos.map((photo,index)=>`<article class="album-photo-editor"><img src="${esc(pending.get(photo.id)?.preview || contentUrl(photo.thumbnail_url || photo.gambar_url,'image'))}" alt="${esc(photo.judul || 'Foto kegiatan')}" loading="lazy"><div><label for="album-caption-${esc(photo.id)}">Keterangan foto ${index+1}</label><textarea id="album-caption-${esc(photo.id)}" data-album-caption="${esc(photo.id)}" maxlength="800" rows="2" placeholder="Ceritakan momen dalam foto ini…">${esc(photo.caption || '')}</textarea><div class="album-photo-tools"><button type="button" data-album-cover="${esc(photo.id)}" aria-pressed="${photo.id===working.sampul_id}">${photo.id===working.sampul_id ? '✓ Sampul' : 'Jadikan sampul'}</button><button type="button" data-album-move="${esc(photo.id)}" data-direction="-1" aria-label="Geser foto ${index+1} ke kiri" ${index===0 ? 'disabled' : ''}>←</button><button type="button" data-album-move="${esc(photo.id)}" data-direction="1" aria-label="Geser foto ${index+1} ke kanan" ${index===working.photos.length-1 ? 'disabled' : ''}>→</button><button type="button" data-album-remove="${esc(photo.id)}" aria-label="Hapus foto ${index+1} dari album">Hapus</button></div></div></article>`).join('') || '<p class="muted">Belum ada foto. Pilih beberapa foto untuk mulai menyusun album.</p>';
    previewCover();
  }
  function addPhotos(photos) {
    const existing=new Set(working.photos.map(photo=>photo.gambar_url));let added=0;
    for(const photo of photos){
      if(working.photos.length>=MAX_ALBUM_PHOTOS)break;
      const full=photo.full || photo.gambar_url;if(existing.has(full))continue;
      existing.add(full);working.photos.push({id:crypto.randomUUID(),judul:(photo.filename || photo.judul || '').replace(/\.[^.]+$/,'').slice(0,140),caption:'',gambar_url:full,thumbnail_url:photo.thumbnail || photo.thumbnail_url || full});added++;
    }
    working.sampul_id ||= working.photos[0]?.id || null;dirty ||= added>0;renderPhotos();
    message(added ? `${added} foto ditambahkan. Urutan dan keterangannya bisa diubah.` : 'Foto yang dipilih sudah ada di album.');
  }
  async function refresh() {
    const request=++sequence;$('[data-album-list-message]').textContent='Memuat album…';
    try {
      const result=await store.list({search:$('[data-album-search]').value.trim(),category:$('[data-album-category]').value,status:$('[data-album-status]').value,page});
      if(disposed||request!==sequence)return;
      rows=result.data;count=result.count;
      if(page>1&&!rows.length){page=Math.max(1,Math.ceil(count/ALBUM_PAGE_SIZE));return refresh();}
      $('[data-album-grid]').innerHTML=rows.map(row=>galleryAlbumCard(row,role==='admin')).join('') || '<p class="muted">Belum ada album yang cocok. Coba filter lain atau buat album kegiatan.</p>';
      $('[data-album-list-message]').textContent='';$('[data-album-page]').textContent=`Halaman ${page} dari ${Math.max(1,Math.ceil(count/ALBUM_PAGE_SIZE))} · ${count} album`;
      $('[data-album-page-prev]').disabled=page<=1;$('[data-album-page-next]').disabled=page*ALBUM_PAGE_SIZE>=count;
    } catch(error){if(!disposed&&request===sequence)$('[data-album-list-message]').textContent=error.message;}
  }
  async function open(id=null) {
    if(busy||role!=='admin')return;
    try {
      edited=id ? await store.get(id) : null;if(disposed)return;
      clearPending();working=edited ? structuredClone(edited) : {judul:'',kategori:'Acara',deskripsi:'',tanggal:'',status:'draft',photos:[],sampul_id:null};dirty=false;
      $('#album-editor-title').textContent=edited ? 'Edit album kegiatan' : 'Buat album kegiatan';
      for(const key of ['judul','kategori','tanggal','deskripsi'])form.elements.namedItem(key).value=working[key] || '';
      message('');renderPhotos();editor.showModal();form.elements.namedItem('judul').focus();
    } catch(error){notify(error.message,true);}
  }
  function closeEditor() {if(busy)return;if(dirty&&!confirm('Tutup album? Perubahan yang belum disimpan akan hilang.'))return;editor.close();}
  async function save(status) {
    if(busy||!working||!form.reportValidity())return;
    captureFields();
    try {
      normalizeGalleryAlbum({...working,status:'draft',photos:[],sampul_id:null});
      if(status==='published'&&!working.photos.length)throw new Error('Tambahkan minimal satu foto sebelum menerbitkan album.');
      if(working.photos.some(photo=>(photo.caption || '').length>800))throw new Error('Keterangan foto maksimal 800 karakter.');
      if(demo&&pending.size)throw new Error('Untuk mencoba album di demo, pilih dokumentasi pondok. Unggah foto baru tersedia pada akun asli.');
      setBusy(true);message('Menyimpan album…');
      const drive=pending.size ? createDriveMedia(client) : null;
      for(const photo of working.photos){
        const file=pending.get(photo.id);if(!file)continue;
        const asset=await drive.upload({file:file.file,original:file.original,thumbnail:file.thumbnail,folder:`Album: ${working.judul}`,onProgress:text=>message(text)});
        photo.gambar_url=asset.full;photo.thumbnail_url=asset.thumbnail;URL.revokeObjectURL(file.preview);pending.delete(photo.id);
      }
      const saved=await store.save({...working,status},edited);if(disposed)return;
      edited=saved;working=structuredClone(saved);dirty=false;editor.close();page=1;await refresh();onChange();
      notify(status==='published' ? demo ? 'Album demo diterbitkan untuk pratinjau lokal.' : 'Album diterbitkan ke galeri website.' : 'Draft album tersimpan. Pengunjung belum melihatnya.');
    } catch(error){message(error.message,true);if(working)renderPhotos();}
    finally{if(!disposed)setBusy(false);}
  }
  async function renderPicker() {
    const request=++pickerSequence,search=$('[data-album-picker-search]').value.trim(),source=$('[data-album-picker-source]').value;
    $('[data-album-picker-status]').textContent='Memuat pilihan foto…';
    try {
      if(source==='pondok'){
        if(!library.length)library=await loadPhotoLibrary();
        const filtered=library.filter(photo=>`${photo.filename} ${photo.folder}`.toLowerCase().includes(search.toLowerCase()));pickerCount=filtered.length;pickerRows=filtered.slice((pickerPage-1)*12,pickerPage*12);
      } else if(demo){
        const data=JSON.parse(sessionStorage.getItem('annahl-demo-content-v1') || '{}');const filtered=(data.galeri_foto || []).filter(photo=>photo.judul.toLowerCase().includes(search.toLowerCase()));pickerCount=filtered.length;pickerRows=filtered.slice((pickerPage-1)*12,pickerPage*12).map(photo=>({...photo,full:photo.gambar_url,thumbnail:photo.thumbnail_url || photo.gambar_url,filename:photo.judul}));
      } else {
        let query=client.from('galeri_foto').select('id,judul,gambar_url,thumbnail_url',{count:'exact'}).order('dibuat_pada',{ascending:false}).order('id');
        if(search)query=query.ilike('judul',`%${search.replace(/[\\%_]/g,'\\$&')}%`);
        const result=await query.range((pickerPage-1)*12,pickerPage*12-1);if(result.error)throw new Error('Foto unggahan belum dapat dimuat.');
        pickerCount=result.count || 0;pickerRows=(result.data || []).map(photo=>({...photo,full:photo.gambar_url,thumbnail:photo.thumbnail_url || photo.gambar_url,filename:photo.judul}));
      }
      if(disposed||request!==pickerSequence)return;
      $('[data-album-picker-grid]').innerHTML=pickerRows.map(photo=>`<label class="album-pick-photo"><input type="checkbox" data-album-select="${esc(photo.id)}" ${selected.has(photo.id) ? 'checked' : ''}><img src="${esc(contentUrl(photo.thumbnail,'image'))}" alt="${esc(photo.filename)}" loading="lazy"><span>${esc(photo.filename)}</span></label>`).join('');
      $('[data-album-picker-status]').textContent=pickerCount ? 'Centang beberapa foto, lalu klik Tambahkan foto.' : 'Belum ada foto yang cocok.';
      $('[data-album-picker-page]').textContent=`Halaman ${pickerPage} dari ${Math.max(1,Math.ceil(pickerCount/12))}`;
      $('[data-album-picker-prev]').disabled=pickerPage<=1;$('[data-album-picker-next]').disabled=pickerPage*12>=pickerCount;
    } catch(error){if(!disposed&&request===pickerSequence)$('[data-album-picker-status]').textContent=error.message;}
  }
  async function pickDrive() {
    captureFields();const scroll=editor.scrollTop;editor.dataset.drivePickerSuspended='true';editor.close();
    try{const photo=await selectDrivePhoto({client,demo});if(photo&&!disposed)addPhotos([photo]);}
    finally{if(!disposed){editor.showModal();editor.scrollTop=scroll;}delete editor.dataset.drivePickerSuspended;}
  }
  const click=async event=>{
    const button=event.target.closest('button');if(!button||busy)return;const data=button.dataset;
    if(button.hasAttribute('data-album-new'))return open();
    if(button.hasAttribute('data-album-refresh'))return refresh();
    if(data.albumEdit)return open(data.albumEdit);
    if(data.openAlbum){try{viewer.show(await store.get(data.openAlbum));}catch(error){notify(error.message,true);}return;}
    if(data.albumArchive||data.albumRestore){
      const id=data.albumArchive || data.albumRestore,row=rows.find(album=>album.id===id);if(!row)return;
      if(data.albumArchive&&!confirm(`Arsipkan album “${row.judul}”? Album disembunyikan dari website dan dapat dipulihkan.`))return;
      try{await store.archive(row,!!data.albumArchive);await refresh();onChange();notify(data.albumArchive ? 'Album diarsipkan.' : 'Album dipulihkan sebagai draft.');}catch(error){notify(error.message,true);}return;
    }
    if(button.hasAttribute('data-album-page-prev')&&page>1){page--;return refresh();}
    if(button.hasAttribute('data-album-page-next')&&page*ALBUM_PAGE_SIZE<count){page++;return refresh();}
    if(button.hasAttribute('data-album-editor-close'))return closeEditor();
    if(button.hasAttribute('data-album-save-draft'))return save('draft');
    if(button.hasAttribute('data-album-preview')){captureFields();return viewer.show({...working,judul:working.judul || 'Pratinjau album'},Object.fromEntries([...pending].map(([id,file])=>[id,file.preview])));}
    if(button.hasAttribute('data-album-pick-local')){captureFields();selected.clear();pickerPage=1;$('[data-album-selected]').textContent='0 foto dipilih';picker.showModal();return renderPicker();}
    if(button.hasAttribute('data-album-pick-drive'))return pickDrive();
    if(button.hasAttribute('data-album-picker-close'))return picker.close();
    if(button.hasAttribute('data-album-picker-prev')&&pickerPage>1){pickerPage--;return renderPicker();}
    if(button.hasAttribute('data-album-picker-next')&&pickerPage*12<pickerCount){pickerPage++;return renderPicker();}
    if(button.hasAttribute('data-album-add-selected')){addPhotos([...selected.values()]);picker.close();return;}
    if(data.albumCover){working.sampul_id=data.albumCover;dirty=true;return renderPhotos();}
    if(data.albumMove){const index=working.photos.findIndex(photo=>photo.id===data.albumMove),target=index+Number(data.direction);if(index>=0&&target>=0&&target<working.photos.length){[working.photos[index],working.photos[target]]=[working.photos[target],working.photos[index]];dirty=true;renderPhotos();}return;}
    if(data.albumRemove){const file=pending.get(data.albumRemove);if(file){URL.revokeObjectURL(file.preview);pending.delete(data.albumRemove);}working.photos=working.photos.filter(photo=>photo.id!==data.albumRemove);if(working.sampul_id===data.albumRemove)working.sampul_id=working.photos[0]?.id || null;dirty=true;renderPhotos();}
  };
  host.addEventListener('click',event=>{click(event).catch(error=>notify(error.message,true));});
  host.addEventListener('input',event=>{
    if(event.target.matches('[data-album-search]')){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{page=1;refresh();},250);return;}
    if(event.target.matches('[data-album-picker-search]')){pickerPage=1;renderPicker();return;}
    if(editor.contains(event.target)&&working){captureFields();const id=event.target.dataset.albumCaption;if(id){const photo=working.photos.find(item=>item.id===id);if(photo)photo.caption=event.target.value;}dirty=true;previewCover();}
  });
  host.addEventListener('change',async event=>{
    if(event.target.matches('[data-album-category],[data-album-status]')){page=1;return refresh();}
    if(event.target.matches('[data-album-picker-source]')){pickerPage=1;return renderPicker();}
    const id=event.target.dataset.albumSelect;if(id){const photo=pickerRows.find(item=>item.id===id);if(event.target.checked&&photo)selected.set(id,photo);else selected.delete(id);$('[data-album-selected]').textContent=`${selected.size} foto dipilih`;return;}
    if(event.target.matches('[data-album-upload]')){
      const files=[...event.target.files];event.target.value='';if(busy||!working)return;
      if(working.photos.length+files.length>MAX_ALBUM_PHOTOS){message(`Satu album maksimal ${MAX_ALBUM_PHOTOS} foto.`);return;}
      setBusy(true);
      try{for(const original of files){message(`Menyiapkan ${original.name}…`);const image=await optimizeImage(original);if(disposed)return;const id=crypto.randomUUID();pending.set(id,{...image,original,preview:URL.createObjectURL(image.file)});working.photos.push({id,judul:original.name.replace(/\.[^.]+$/,'').slice(0,140),caption:'',gambar_url:'',thumbnail_url:''});working.sampul_id ||= id;}dirty=true;renderPhotos();message('Foto siap. Isi cerita lalu simpan draft atau terbitkan album.');}
      catch(error){message(error.message,true);renderPhotos();}finally{if(!disposed)setBusy(false);}
    }
  });
  form.addEventListener('submit',event=>{event.preventDefault();save('published');});
  editor.addEventListener('cancel',event=>{event.preventDefault();closeEditor();});
  editor.addEventListener('close',()=>{if(editor.dataset.drivePickerSuspended==='true')return;dirty=false;clearPending();});
  const beforeUnload=event=>{if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',beforeUnload);
  refresh();
  return {refresh,openNew:()=>open(),get dirty(){return dirty;},dispose(){disposed=true;sequence++;pickerSequence++;clearTimeout(searchTimer);clearPending();viewer.dispose();editor.close();picker.close();window.removeEventListener('beforeunload',beforeUnload);host.replaceChildren();}};
}
