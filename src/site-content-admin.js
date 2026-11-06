import { SITE_PAGES, blankSiteContent, createContentCatalog, normalizeSiteDocument, renderSiteContent, contentUrl } from './site-content.js';
import { createSiteContentStore } from './site-content-store.js';
import { pageTemplate } from './site-page-templates.js';
import { escapeHtml as esc } from './content-format.js';
import { optimizeImage } from './editor-tools.js';
import { photos, photoThumbnail } from './data/photos.js';
import { createDriveMedia } from './drive-media.js';
import { selectDrivePhoto } from './drive-picker.js';
import { loadLatestStories, storyCard } from './home-stories.js';
import baseCss from './styles/index.css?url';
import componentsCss from './styles/components.css?url';
import pagesCss from './styles/pages.css?url';

export function mountWebsiteManager({ host, client, demo, userId, role, notify }) {
  const store = createSiteContentStore(client, { role, storage: demo ? sessionStorage : null });
  let page = null, html = '', catalog = null, working = blankSiteContent(), baseline = '', versions = { draft: 0, published: 0 };
  let busy = false, sequence = 0, disposed = false, localDraft = null, library = [], libraryPage = 0, pickerField = '', history = [];
  const pending = new Map();
  let selectedBlock = null, fieldTab = "text", mobileView = "edit", liveWidth = 390, livePreviewTimer, liveRequest = 0, previewObserver = null;
  const $ = selector => host.querySelector(selector);
  const localKey = () => `annahl-site-draft-v1:${demo ? 'demo' : 'live'}:${userId}:${page?.id}`;
  const dirty = () => !!page && (JSON.stringify(working) !== baseline || pending.size > 0);
  const clearPhotos = () => { for (const photo of pending.values()) URL.revokeObjectURL(photo.preview); pending.clear(); };
  function remember() {
    try { localStorage.setItem(localKey(), JSON.stringify({ content: working, versions, savedAt: new Date().toISOString() })); }
    catch { notify('Salinan lokal belum dapat disimpan. Simpan draft sebelum menutup halaman.', true); }
    scheduleLivePreview();
    const status = $('#cms-local-status'); if (status) status.textContent = 'Perubahan belum diterbitkan · teks tersimpan di perangkat ini';
  }
  const beforeUnload = event => { if (dirty()) { event.preventDefault(); event.returnValue = ''; } };
  window.addEventListener('beforeunload', beforeUnload);
  function landing() {
    host.innerHTML = `<div class="page-heading"><div><span class="eyebrow">WEBSITE DALAM GENGGAMAN</span><h1>Edit website</h1><p class="muted">Pilih halaman, ubah isinya, lalu terbitkan saat sudah siap.</p></div></div><div class="cms-intro"><span class="cms-intro-mark" aria-hidden="true">✳</span><div><h2>Kelola langsung dari akun pondok.</h2><p>Pilih halaman dan bagian yang ingin diubah. Edit tulisan, foto, atau tautan sambil melihat hasilnya.</p></div></div><div class="cms-page-grid">${SITE_PAGES.map(item => `<button class="cms-page-card" data-cms-page="${item.id}">${photos.hero[item.id] ? `<img src="${esc(photoThumbnail(photos.hero[item.id]))}" alt="" loading="lazy" />` : '<span class="cms-page-symbol" aria-hidden="true">N</span>'}<span class="cms-page-copy"><strong>${esc(item.title)}</strong><span>${esc(item.description)}</span><small>Kelola halaman <span aria-hidden="true">↗</span></small></span></button>`).join('')}</div><div class="cms-post-note"><strong>Ingin membagikan kabar baru?</strong><p>Postingan berita, foto, dan video tetap dibuat melalui menu Berita dan Galeri.</p></div>`;
  }
  function matchingBlocks() {
    const query=($('#cms-find-field')?.value || '').trim().toLocaleLowerCase('id');
    return catalog.blocks.filter(block=>!query || `${block.title} ${block.fields.map(field=>working.values[field.id] ?? field.value).join(' ')}`.toLocaleLowerCase('id').includes(query));
  }
  function cards() {
    $('#cms-blocks').innerHTML=matchingBlocks().map((block,index)=>{
      const heading=block.fields.find(field=>field.kind==='heading');
      const title=heading ? working.values[heading.id] ?? heading.value : block.title;
      const changed=block.fields.filter(field=>working.values[field.id]!==undefined).length;
      return `<div class="cms-section-choice"><button type="button" class="cms-section-tab" data-cms-block="${block.id}" aria-pressed="${block.id===selectedBlock}"><span class="cms-section-number">${index+1}</span><span><strong>${esc(title)}</strong><small>${working.hidden.includes(block.id) ? 'Disembunyikan' : changed ? `${changed} perubahan` : 'Klik untuk mengedit'}</small></span></button>${block.hideable ? `<button type="button" class="cms-visibility-action" data-cms-${working.hidden.includes(block.id) ? 'restore' : 'remove'}="${block.id}" aria-label="${working.hidden.includes(block.id) ? 'Tampilkan' : 'Sembunyikan'} ${esc(block.title)}">${working.hidden.includes(block.id) ? 'Tampilkan' : 'Sembunyikan'}</button>` : ''}</div>`;
    }).join('') || '<p class="muted">Tidak ada bagian yang cocok.</p>';
  }
  function draw() {
    previewObserver?.disconnect();
    const shortcut=page.id==='galeri' ? ['galeri','Kelola album, foto, dan video'] : page.id==='berita' ? ['berita','Kelola postingan berita'] : page.id==='pendaftaran' ? ['pendaftaran','Atur tahun dan jadwal penerimaan'] : page.id==='program' ? ['pengaturan','Atur daftar jenjang pendidikan'] : null;
    host.innerHTML=`<div class="cms-page-top"><button class="text-link" data-cms-action="pages">← Semua halaman</button><a class="text-link" href="/#${page.path}" target="_blank" rel="noopener">Lihat website ↗</a></div><div class="page-heading"><div><span class="eyebrow">EDIT LANGSUNG, LIHAT HASILNYA</span><h1>${esc(page.title)}</h1><p class="muted">Pilih bagian di sebelah kiri, lalu ubah isinya.</p></div><span class="status-badge">${versions.published ? `Terbit · versi ${versions.published}` : 'Isi awal website'}</span></div>
    <div class="cms-publish-bar"><div><strong>Perubahan siap saat Anda siap.</strong><p id="cms-local-status">${versions.draft ? 'Draft terakhir tersimpan. Terbitkan untuk menampilkannya.' : 'Edit isian di bawah. Hasilnya langsung terlihat di pratinjau.'}</p></div><div><button class="button secondary compact" data-cms-action="preview">Halaman penuh</button><button class="button secondary compact" data-cms-action="draft">Simpan draft</button><button class="button compact" data-cms-action="publish">Terbitkan perubahan</button></div></div>
    ${shortcut ? `<div class="cms-related-task"><span>Ingin mengubah data kegiatannya?</span><button type="button" class="text-link" data-go="${shortcut[0]}" ${shortcut[0]==='galeri' ? 'data-kind="album"' : ''}>${shortcut[1]} ↗</button></div>` : ''}
    <div id="cms-recovery" class="cms-recovery" ${localDraft ? '' : 'hidden'}><span>Ada salinan teks dari pengeditan sebelumnya.</span><button class="text-link" data-cms-action="recover">Pulihkan untuk ditinjau</button><button class="text-link" data-cms-action="forget">Abaikan</button></div><p id="cms-error" class="form-message" role="status"></p>
    <div class="cms-mobile-view-switch" role="group" aria-label="Tampilan editor"><button type="button" data-cms-mobile-view="edit" aria-pressed="${mobileView==='edit'}">Edit isian</button><button type="button" data-cms-mobile-view="preview" aria-pressed="${mobileView==='preview'}">Lihat hasil</button></div><div class="cms-workbench" data-cms-view="${mobileView}"><aside class="cms-section-nav"><label for="cms-find-field">Cari bagian atau tulisan</label><input id="cms-find-field" type="search" placeholder="Contoh: alamat, pengasuh…"><div id="cms-blocks"></div></aside>
    <section class="cms-inline-editor" id="cms-editor" aria-labelledby="cms-editor-title"><form id="cms-fields-form"><div class="cms-inline-heading"><span class="eyebrow">BAGIAN YANG DIEDIT</span><h2 id="cms-editor-title"></h2><p>Isi bidang yang diperlukan. Perubahan belum tampil di website sampai diterbitkan.</p></div><div class="cms-field-tabs" role="group" aria-label="Jenis isian"><button type="button" data-cms-field-tab="text" aria-pressed="true">Tulisan</button><button type="button" data-cms-field-tab="image" aria-pressed="false">Foto</button><button type="button" data-cms-field-tab="link" aria-pressed="false">Tautan & peta</button></div><div id="cms-fields" class="cms-fields"></div><div class="cms-inline-footer"><button class="button secondary compact" type="button" data-cms-action="preview">Perbesar pratinjau</button><button class="button compact" type="submit">Simpan draft</button></div></form></section>
    <aside class="cms-live-preview"><div class="cms-live-heading"><div><strong>Pratinjau langsung</strong><p id="cms-live-note">Bagian yang sedang Anda edit.</p></div><div class="cms-device-switch" role="group" aria-label="Perangkat pratinjau"><button type="button" data-cms-live-width="390" aria-pressed="true">Ponsel</button><button type="button" data-cms-live-width="1100" aria-pressed="false">Desktop</button></div></div><div class="cms-live-stage" data-cms-live-stage><iframe id="cms-live-frame" sandbox="" title="Pratinjau langsung bagian website"></iframe></div></aside></div>
    <details class="cms-history"><summary>Riwayat penerbitan halaman</summary><div id="cms-history-list"><button class="text-link" data-cms-action="history">Muat riwayat</button></div></details>
      <dialog class="cms-preview-dialog" id="cms-preview" aria-labelledby="cms-preview-title"><div class="dialog-header"><div><h2 id="cms-preview-title">Pratinjau ${esc(page.title)}</h2><p class="muted">Menampilkan perubahan sementara, termasuk foto baru. Formulir tidak mengirim data.</p></div><button class="icon-button" data-cms-action="close-preview" aria-label="Tutup pratinjau">×</button></div><div class="cms-preview-tools"><button class="button secondary compact" data-cms-width="desktop">Desktop</button><button class="button secondary compact" data-cms-width="phone">Ponsel</button></div><iframe id="cms-preview-frame" sandbox="" title="Pratinjau halaman website"></iframe></dialog>
      <dialog class="cms-picker-dialog" id="cms-picker" aria-labelledby="cms-picker-title"><div class="dialog-header"><div><span class="eyebrow">DOKUMENTASI PONDOK</span><h2 id="cms-picker-title">Pilih foto</h2></div><button class="icon-button" data-cms-action="close-picker" aria-label="Tutup pilihan foto">×</button></div><div class="cms-picker-body"><input id="cms-photo-search" type="search" placeholder="Cari kegiatan atau nama foto…" aria-label="Cari foto pondok" /><div id="cms-photo-grid" class="cms-photo-grid"></div><div class="cms-picker-pagination"><button class="button secondary compact" data-cms-action="photo-prev">← Sebelumnya</button><span id="cms-photo-page"></span><button class="button secondary compact" data-cms-action="photo-next">Berikutnya →</button></div></div></dialog>`;
    cards();
    $('#cms-fields-form').addEventListener('submit',event=>{event.preventDefault();save(false);});
    $('#cms-photo-search').addEventListener('input',()=>{libraryPage=0;photoGrid();});
    if(typeof ResizeObserver!=='undefined'){previewObserver=new ResizeObserver(scaleLivePreview);previewObserver.observe($('[data-cms-live-stage]'));}
    editBlock(catalog.blocks.some(block=>block.id===selectedBlock) ? selectedBlock : catalog.blocks[0]?.id);
  }
  async function open(id) {
    if (disposed || busy) return;
    if (dirty() && !confirm('Masih ada perubahan yang belum diterbitkan. Pindah halaman? Salinan teks tetap disimpan di perangkat ini.')) return;
    clearPhotos(); const request = ++sequence;
    if (!id) { page = null; landing(); return; }
    page = SITE_PAGES.find(item => item.id === id); if (!page) return;
    host.innerHTML = '<div class="empty-state" role="status"><h2>Menyiapkan isi halaman…</h2></div>';
    try {
      const [template, state] = await Promise.all([pageTemplate(id), store.load(id)]);
      if (disposed || request !== sequence) return;
      html = template; catalog = createContentCatalog(html);
      working = normalizeSiteDocument(state.draft?.content || state.published?.content || blankSiteContent(), catalog);
      versions = { draft: state.draft?.revision || 0, published: state.published?.revision || 0 };
      baseline = JSON.stringify(working); localDraft = null;
      try { const saved = JSON.parse(localStorage.getItem(localKey()) || 'null'); if (saved?.content && JSON.stringify(saved.content) !== baseline) localDraft = saved; } catch { /* Unreadable local copies do not block editing. */ }
      draw();
    } catch (error) { if (!disposed && request === sequence) { page = null; host.innerHTML = `<div class="empty-state"><h2>Halaman belum dapat disiapkan.</h2><p>${esc(error.message)}</p><button class="button secondary" data-cms-page="${id}">Coba lagi</button></div>`; } }
  }
  function fieldMarkup(field, index) {
    const value = working.values[field.id] ?? field.value;
    const label = `${field.label}${['heading','text'].includes(field.kind) && field.value ? ` · ${field.value.slice(0, 58)}${field.value.length>58 ? '…' : ''}` : ''}`;
    const name = `cms-input-${index}`;
    if (field.kind === 'image') return `<div class="cms-field"><label for="${name}">${esc(label)}</label><img class="cms-image-preview" data-cms-image="${field.id}" src="${esc(pending.get(field.id)?.preview || value)}" alt="Pratinjau foto" /><div class="cms-image-actions"><button type="button" class="button secondary compact" data-cms-drive="${field.id}">Ambil dari Drive</button><button type="button" class="button secondary compact" data-cms-pick="${field.id}">Pilih foto pondok</button><label class="button secondary compact cms-upload-label">Unggah foto<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-cms-upload="${field.id}" /></label></div><details><summary>Gunakan tautan foto</summary><input id="${name}" data-cms-field="${field.id}" value="${esc(value)}" maxlength="2048" inputmode="url" /></details></div>`;
    if (field.kind === 'text' && value.length > 100) return `<div class="cms-field"><label for="${name}">${esc(label)}</label><textarea id="${name}" data-cms-field="${field.id}" rows="4" maxlength="8000" dir="auto">${esc(value)}</textarea></div>`;
    return `<div class="cms-field"><label for="${name}">${esc(label)}</label><input id="${name}" data-cms-field="${field.id}" type="${field.kind === 'number' ? 'number' : 'text'}" ${field.kind === 'number' ? 'min="0" max="9999999"' : ''} ${['link','map'].includes(field.kind) ? 'inputmode="url"' : ''} dir="auto" value="${esc(value)}" maxlength="${['image','link','map'].includes(field.kind) ? 2048 : 8000}" /></div>`;
  }
  const fieldGroup=field=>['image'].includes(field.kind)||field.label==='Keterangan foto' ? 'image' : ['link','map'].includes(field.kind) ? 'link' : 'text';
  function editBlock(id, forceMatch = false) {
    const block=catalog.blocks.find(item=>item.id===id);if(!block)return;
    selectedBlock=id;$('#cms-editor-title').textContent=block.title;
    const query=($('#cms-find-field')?.value || '').trim().toLocaleLowerCase('id');
    const groups=['text','image','link'];
    if(!block.fields.some(field=>fieldGroup(field)===fieldTab) && !(fieldTab==='image'&&block.fixedImages.length))fieldTab=groups.find(group=>block.fields.some(field=>fieldGroup(field)===group)) || 'text';
    if(query && forceMatch){const match=block.fields.find(field=>`${field.label} ${working.values[field.id] ?? field.value}`.toLocaleLowerCase('id').includes(query));if(match)fieldTab=fieldGroup(match);}
    host.querySelectorAll('[data-cms-field-tab]').forEach(button=>{const kind=button.dataset.cmsFieldTab;button.setAttribute('aria-pressed',String(kind===fieldTab));button.disabled=!block.fields.some(field=>fieldGroup(field)===kind)&&!(kind==='image'&&block.fixedImages.length);});
    const fields=block.fields.filter(field=>fieldGroup(field)===fieldTab).sort((a,b)=>(a.kind==='heading' ? -1 : 0)-(b.kind==='heading' ? -1 : 0));
    const fixed=fieldTab==='image' ? block.fixedImages.map(photo=>`<div class="cms-field"><img class="cms-image-preview" src="${esc(photo.src)}" alt="${esc(photo.alt)}"><p class="muted">Foto profil tetap memakai foto resmi. Nama dan keterangan tetap dapat diperbarui di bawah.</p></div>`).join('') : '';
    $('#cms-fields').innerHTML=`${block.hideable ? `<label class="cms-visible"><input type="checkbox" data-cms-hide="${id}" ${working.hidden.includes(id) ? '' : 'checked'}> Tampilkan bagian ini di website</label>` : ''}${fixed}${fields.map(fieldMarkup).join('') || (!fixed ? '<p class="muted">Tidak ada isian pada tab ini.</p>' : '')}`;
    cards();scheduleLivePreview();
  }
  function scaleLivePreview() {
    const stage=$('[data-cms-live-stage]'),frame=$('#cms-live-frame');if(!stage||!frame)return;
    const scale=Math.min(1,(stage.clientWidth || 360)/liveWidth);
    const height=Math.max(400,Math.floor(Math.min(620,(window.innerHeight || 900)-280)/scale));
    frame.style.width=`${liveWidth}px`;frame.style.height=`${height}px`;frame.style.transform=`scale(${scale})`;stage.style.height=`${Math.round(height*scale)}px`;
    host.querySelectorAll('[data-cms-live-width]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.cmsLiveWidth)===liveWidth)));
  }
  function scheduleLivePreview() {
    clearTimeout(livePreviewTimer);const version=++liveRequest;
    if($('#cms-live-frame'))livePreviewTimer=setTimeout(()=>drawLivePreview(version),160);
  }
  async function drawLivePreview(version) {
    if(disposed||!page||!selectedBlock)return;
    try{
      const clone=createContentCatalog(html),content=normalizeSiteDocument(working,clone);
      for(const field of clone.fields)if(content.values[field.id]!==undefined)field.apply(content.values[field.id]);
      for(const [id,photo] of pending){
        if(!photo.previewData)photo.previewData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Pratinjau foto belum siap.'));reader.readAsDataURL(photo.file);});
        clone.fields.find(field=>field.id===id&&field.kind==='image')?.apply(photo.previewData);
      }
      if(disposed||version!==liveRequest||!$('#cms-live-frame'))return;
      const block=clone.blocks.find(item=>item.id===selectedBlock),body=block?.element.outerHTML || '';
      const css=[baseCss,componentsCss,pagesCss].map(url=>`<link rel="stylesheet" href="${esc(url)}">`).join('');
      $('#cms-live-frame').srcdoc=`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><base href="${esc(location.origin)}/">${css}<style>.reveal{opacity:1!important;transform:none!important}.navbar{position:relative;background:#14532d}body{overflow-x:hidden;background:white}form,a,button{pointer-events:none}.hero{min-height:460px!important}</style></head><body>${body}</body></html>`;
      $('#cms-live-note').textContent=working.hidden.includes(selectedBlock) ? 'Bagian ini disembunyikan. Anda tetap bisa meninjau isinya.' : 'Hasil bagian ini berubah saat Anda mengetik.';scaleLivePreview();
    }catch(error){if($('#cms-live-note'))$('#cms-live-note').textContent=error.message;}
  }
  async function preview() {
    const request = sequence;
    try {
      const content = normalizeSiteDocument(working, catalog);
      // The sandboxed frame has an opaque origin and cannot read parent blob URLs.
      // Inline only the already-validated raster file, in memory, for this preview.
      const previewImages = Object.fromEntries(await Promise.all([...pending].map(async ([id, photo]) => {
        if (!photo.previewData) photo.previewData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Foto belum dapat ditampilkan. Pilih ulang foto lalu coba lagi.'));
          reader.readAsDataURL(photo.file);
        });
        return [id, photo.previewData];
      })));
      if (disposed || sequence !== request) return;
      let body = renderSiteContent(html, content, document, previewImages);
      if (page.id === 'beranda' && client && !demo) {
        const stories = await loadLatestStories(client);
        if (disposed || sequence !== request) return;
        const template = document.createElement('template'); template.innerHTML = body;
        const grid = template.content.querySelector('#home-stories-grid');
        if (grid) grid.innerHTML = stories.items.map(storyCard).join('');
        const status = template.content.querySelector('#home-stories-status');
        if (status) status.textContent = stories.unavailable ? 'Sebagian cerita belum dapat dimuat.' : stories.items.length ? '' : 'Belum ada cerita yang diterbitkan.';
        body = template.innerHTML;
      } else if (page.id === 'beranda') {
        body = body.replace('Memuat cerita…', 'Cerita terbaru akan ditampilkan otomatis dari konten yang diterbitkan.');
      }
      const css = [baseCss, componentsCss, pagesCss].map(url => `<link rel="stylesheet" href="${esc(url)}">`).join('');
      $('#cms-preview-frame').srcdoc = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><base href="${esc(location.origin)}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap">${css}<style>.reveal{opacity:1!important;transform:none!important}.navbar{position:relative;background:#14532d}body{overflow-x:hidden}form{pointer-events:none}</style></head><body>${body}</body></html>`;
      $('#cms-preview').showModal();
    } catch (error) { notify(error.message, true); }
  }
  async function save(publish) {
    if (busy || !page) return;
    let content;
    try { content = normalizeSiteDocument(working, catalog); } catch (error) { notify(error.message, true); return; }
    busy = true; $('#cms-error').textContent = '';
    host.querySelectorAll('[data-cms-action="publish"],[data-cms-action="draft"],[data-cms-block]').forEach(button => { button.disabled = true; });
    try {
      for (const [id, photo] of pending) {
        if (!photo.url) {
          if (demo) throw new Error('Pada demo, pilih foto pondok dari galeri. Unggahan baru tersedia pada akun asli.');
          const asset = await createDriveMedia(client).upload({file:photo.file,original:photo.original,thumbnail:photo.thumbnail,onProgress:message=>{ $('#cms-error').textContent=message; }});
          photo.url = asset.full;
        }
        content.values[id] = photo.url;
      }
      working = content; remember();
      const result = await store.save(page.id, content, versions, publish);
      if (disposed) return;
      versions = { draft: result.draft.revision, published: result.published?.revision || 0 };
      clearPhotos(); baseline = JSON.stringify(working); localDraft = null;
      try { localStorage.removeItem(localKey()); } catch { /* Server acknowledgement is authoritative. */ }
      draw(); notify(publish ? demo ? 'Pratinjau demo diperbarui. Website publik tetap memakai data asli.' : 'Perubahan diterbitkan. Muat ulang website untuk melihatnya.' : 'Draft tersimpan. Pengunjung masih melihat versi yang diterbitkan.');
    } catch (error) { if (!disposed) { $('#cms-error').textContent = error.message; notify(error.message, true); } }
    finally { busy = false; if (!disposed) host.querySelectorAll('[data-cms-action="publish"],[data-cms-action="draft"],[data-cms-block]').forEach(button => { button.disabled = false; }); }
  }
  function photoGrid() {
    const query = ($('#cms-photo-search').value || '').toLowerCase();
    const rows = library.filter(row => `${row.folder} ${row.filename}`.toLowerCase().includes(query));
    const max = Math.max(1, Math.ceil(rows.length / 24)); libraryPage = Math.min(libraryPage, max - 1);
    $('#cms-photo-grid').innerHTML = rows.slice(libraryPage * 24, libraryPage * 24 + 24).map(row => `<button type="button" data-cms-photo="${esc(row.id)}"><img src="${esc(row.thumbnail)}" alt="${esc(row.folder)}" loading="lazy" /><span>${esc(row.filename)}</span></button>`).join('') || '<p>Foto belum ditemukan.</p>';
    $('#cms-photo-page').textContent = `${libraryPage + 1} / ${max}`;
    $('[data-cms-action="photo-prev"]').disabled = libraryPage === 0;
    $('[data-cms-action="photo-next"]').disabled = libraryPage + 1 >= max;
  }
  const click = async event => {
    const button = event.target.closest('button'); if (!button || busy) return;
    const data = button.dataset;
    if (data.cmsPage) return open(data.cmsPage);
    if (data.cmsBlock) return editBlock(data.cmsBlock);
    if (data.cmsFieldTab) {fieldTab=data.cmsFieldTab;return editBlock(selectedBlock);}
    if (data.cmsLiveWidth) {liveWidth=Number(data.cmsLiveWidth);scaleLivePreview();return;}
    if(data.cmsMobileView){mobileView=data.cmsMobileView;$('.cms-workbench').dataset.cmsView=mobileView;host.querySelectorAll('[data-cms-mobile-view]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.cmsMobileView===mobileView)));scaleLivePreview();return;}
    if (data.cmsDrive) {
      const photo = await selectDrivePhoto({client,demo});
      if (!photo || disposed) return;
      const old=pending.get(data.cmsDrive);if(old)URL.revokeObjectURL(old.preview);pending.delete(data.cmsDrive);
      working.values[data.cmsDrive]=photo.full;
      $(`[data-cms-field="${data.cmsDrive}"]`).value=photo.full;
      $(`[data-cms-image="${data.cmsDrive}"]`).src=photo.full;
      remember();return;
    }
    if (data.cmsRemove || data.cmsRestore) {
      const id = data.cmsRemove || data.cmsRestore;
      const block = catalog.blocks.find(item => item.id === id && item.hideable);
      if (!block) return;
      if (data.cmsRemove && !confirm(`Hapus bagian “${block.title}” dari website? Bagian ini dapat dipulihkan. Perubahan berlaku setelah diterbitkan.`)) return;
      working.hidden = working.hidden.filter(value => value !== id);
      if (data.cmsRemove) working.hidden.push(id);
      remember(); cards(); return;
    }
    if (data.cmsWidth) { $('#cms-preview-frame').classList.toggle('phone', data.cmsWidth === 'phone'); return; }
    if (data.cmsPick) {
      pickerField = data.cmsPick; libraryPage = 0;
      try { library ||= []; if (!library.length) library = await import('./photo-library.js').then(module => module.loadPhotoLibrary()); if (disposed) return; photoGrid(); $('#cms-picker').showModal(); }
      catch { notify('Galeri belum dapat dimuat. Coba lagi.', true); } return;
    }
    if (data.cmsPhoto) {
      const photo = library.find(item => item.id === data.cmsPhoto); if (!photo) return;
      const old = pending.get(pickerField); if (old) URL.revokeObjectURL(old.preview); pending.delete(pickerField);
      working.values[pickerField] = photo.full; remember();
      $(`[data-cms-image="${pickerField}"]`).src = photo.full; $(`[data-cms-field="${pickerField}"]`).value = photo.full;
      $('#cms-picker').close(); return;
    }
    switch (data.cmsAction) {
      case 'pages': return open(null);
      case 'draft': return save(false);
      case 'publish': return save(true);
      case 'preview': return preview();
      case 'close-editor': host.querySelector(`[data-cms-block="${selectedBlock}"]`)?.focus(); return;
      case 'close-preview': $('#cms-preview').close(); return;
      case 'close-picker': $('#cms-picker').close(); return;
      case 'photo-prev': libraryPage--; photoGrid(); return;
      case 'photo-next': libraryPage++; photoGrid(); return;
      case 'recover':
        if (localDraft && confirm('Pulihkan teks salinan lokal untuk ditinjau? Periksa kembali sebelum menerbitkan.')) { working = normalizeSiteDocument(localDraft.content, catalog); localDraft = null; remember(); draw(); } return;
      case 'forget': localDraft = null; try { localStorage.removeItem(localKey()); } catch {} $('#cms-recovery').hidden = true; return;
      case 'history':
        try { history = await store.history(page.id); $('#cms-history-list').innerHTML = history.map((row, index) => `<div class="cms-history-row"><span>${esc(new Date(row.created_at).toLocaleString('id-ID'))}</span><button class="text-link" data-cms-history="${index}">Pulihkan sebagai draft</button></div>`).join('') || '<p>Belum ada riwayat penerbitan.</p>'; }
        catch (error) { notify(error.message, true); } return;
    }
    if (data.cmsHistory !== undefined && history[Number(data.cmsHistory)] && confirm('Gunakan versi ini sebagai draft untuk ditinjau? Website belum akan berubah.')) {
      working = normalizeSiteDocument(history[Number(data.cmsHistory)].content, catalog); remember(); cards(); notify('Versi lama dipulihkan ke editor. Periksa lalu simpan draft atau terbitkan.');
    }
  };
  const input = event => {
    if (busy || !page) return;
    if(event.target.id==='cms-find-field'){cards();const blocks=matchingBlocks();if(blocks.length)editBlock(blocks.find(block=>block.id===selectedBlock)?.id || blocks[0].id,true);else $('#cms-fields').innerHTML='<p>Tidak ada isian yang cocok. Coba kata kunci lain.</p>';return;}
    const field = event.target.dataset.cmsField;
    if (field) {
      const original = catalog.fields.find(item => item.id === field); if (!original) return;
      if (event.target.value === original.value) delete working.values[field]; else working.values[field] = event.target.value;
      if (original.kind === 'image') {
        const old = pending.get(field); if (old) URL.revokeObjectURL(old.preview); pending.delete(field);
        if (contentUrl(event.target.value, 'image')) $(`[data-cms-image="${field}"]`).src = event.target.value;
      }
      remember();
    }
    const hidden = event.target.dataset.cmsHide;
    if (hidden) { working.hidden = working.hidden.filter(id => id !== hidden); if (!event.target.checked) working.hidden.push(hidden); remember(); }
  };
  const change = async event => {
    const id = event.target.dataset.cmsUpload, file = event.target.files?.[0]; if (!id || !file || busy) return;
    busy = true;
    try {
      const image = await optimizeImage(file); if (disposed) return;
      const old = pending.get(id); if (old) URL.revokeObjectURL(old.preview);
      const photo = { file: image.file, original:file, thumbnail:image.thumbnail, preview: URL.createObjectURL(image.file) }; pending.set(id, photo);
      $(`[data-cms-image="${id}"]`).src = photo.preview; remember(); notify('Foto siap. Simpan draft atau terbitkan untuk mengunggahnya.');
    } catch (error) { notify(error.message, true); }
    finally { busy = false; }
  };
  const onClick = event => { click(event).catch(error => { if (!disposed) notify(error.message || 'Tindakan belum berhasil. Coba lagi.', true); }); };
  host.addEventListener('click', onClick); host.addEventListener('input', input); host.addEventListener('change', change);
  landing();
  return { open, get dirty() { return dirty(); }, dispose() { disposed = true; sequence++; liveRequest++; clearTimeout(livePreviewTimer); previewObserver?.disconnect(); clearPhotos(); window.removeEventListener('beforeunload', beforeUnload); host.removeEventListener('click', onClick); host.removeEventListener('input', input); host.removeEventListener('change', change); host.innerHTML = ''; } };
}
