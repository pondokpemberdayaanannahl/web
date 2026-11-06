import { escapeHtml as esc } from './content-format.js';
import { contentUrl } from './site-content.js';
import { albumSummary } from './gallery-albums.js';

export function galleryAlbumCard(input, admin = false) {
  const album=albumSummary(input),cover=contentUrl(album.sampul_thumbnail || album.sampul_url,'image');
  return `<article class="album-card"><button type="button" class="album-cover" data-open-album="${esc(album.id)}" aria-label="Buka album ${esc(album.judul)}">${cover ? `<img src="${esc(cover)}" alt="${esc(album.judul)}" loading="lazy" decoding="async">` : '<span class="album-cover-empty" aria-hidden="true">▧</span>'}<span class="album-photo-count">${album.photo_count} foto</span></button><div class="album-card-copy"><div class="album-card-meta"><span>${esc(album.kategori)}</span>${admin ? `<span>${album.deleted_at ? 'Diarsipkan' : album.status==='draft' ? 'Draft' : 'Terbit'}</span>` : ''}</div><h3>${esc(album.judul)}</h3><p>${esc(album.deskripsi || 'Buka album untuk melihat cerita dan foto kegiatan.')}</p>${admin ? `<div class="album-card-actions">${album.deleted_at ? `<button type="button" class="row-action" data-album-restore="${esc(album.id)}">Pulihkan ke draft</button>` : `<button type="button" class="row-action" data-album-edit="${esc(album.id)}">Edit album</button><button type="button" class="row-action danger" data-album-archive="${esc(album.id)}">Arsipkan</button>`}</div>` : `<button type="button" class="album-open-link" data-open-album="${esc(album.id)}">Lihat album <span aria-hidden="true">↗</span></button>`}</div></article>`;
}

export function createAlbumViewer(host = document.body) {
  const dialog=document.createElement('dialog');dialog.className='album-viewer';dialog.setAttribute('aria-label','Album foto kegiatan');host.append(dialog);
  let current=null,index=0,previousOverflow='',disposed=false,previews={};
  const $=selector=>dialog.querySelector(selector);
  const source=(photo,thumbnail=false)=>/^blob:/.test(previews[photo.id] || '') ? previews[photo.id] : contentUrl(thumbnail ? photo.thumbnail_url || photo.gambar_url : photo.gambar_url,'image');
  function renderPhoto() {
    const photos=current.photos || [],photo=photos[index];
    $('[data-album-stage]').innerHTML=photo ? `<img src="${esc(source(photo))}" alt="${esc(photo.judul || current.judul)}" decoding="async">` : '<p>Album belum berisi foto.</p>';
    $('[data-photo-caption]').textContent=photo?.caption || photo?.judul || '';
    $('[data-photo-position]').textContent=photos.length ? `${index+1} / ${photos.length}` : '0 foto';
    $('[data-album-prev]').disabled=index<=0;$('[data-album-next]').disabled=index>=photos.length-1;
    dialog.querySelectorAll('[data-album-thumb]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.albumThumb)===index)));
    $(`[data-album-thumb="${index}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  function close() { if (dialog.open) dialog.close(); }
  function show(album,temporaryImages={}) {
    if (disposed) return;
    current=album;index=0;previews=temporaryImages;
    dialog.innerHTML=`<div class="album-viewer-heading"><div><span class="album-kicker">${esc(album.kategori || 'FOTO KEGIATAN')}</span><h2>${esc(album.judul)}</h2>${album.tanggal ? `<time>${esc(new Date(album.tanggal+'T12:00:00+07:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}))}</time>` : ''}</div><button type="button" class="album-close" data-album-close aria-label="Tutup album">×</button></div>${album.deskripsi ? `<p class="album-story">${esc(album.deskripsi)}</p>` : ''}<div class="album-stage" data-album-stage></div><div class="album-photo-info"><p data-photo-caption></p><div class="album-viewer-nav"><button type="button" data-album-prev aria-label="Foto sebelumnya">←</button><span data-photo-position></span><button type="button" data-album-next aria-label="Foto berikutnya">→</button></div></div><div class="album-thumbnails">${(album.photos || []).map((photo,at)=>`<button type="button" data-album-thumb="${at}" aria-label="Lihat foto ${at+1}" aria-pressed="${at===0}"><img src="${esc(source(photo,true))}" alt="" loading="lazy"></button>`).join('')}</div>`;
    if (!dialog.open) { previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal(); }
    renderPhoto();
  }
  dialog.addEventListener('click',event=>{
    if (event.target===dialog) return close();
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-album-close'))return close();
    if(button.hasAttribute('data-album-prev')&&index>0)index--;
    if(button.hasAttribute('data-album-next')&&index<(current.photos || []).length-1)index++;
    if(button.dataset.albumThumb!==undefined)index=Number(button.dataset.albumThumb);
    renderPhoto();
  });
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'&&index>0){event.preventDefault();index--;renderPhoto();}
    if(event.key==='ArrowRight'&&index<(current?.photos || []).length-1){event.preventDefault();index++;renderPhoto();}
  });
  dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;const image=$('[data-album-stage] img');if(image)image.removeAttribute('src');});
  function dispose(){disposed=true;close();dialog.remove();window.removeEventListener('hashchange',dispose);}
  window.addEventListener('hashchange',dispose,{once:true});
  return {show,close,dispose};
}
