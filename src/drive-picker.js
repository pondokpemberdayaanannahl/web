import { createDriveMedia } from './drive-media.js';
import { escapeHtml as esc } from './content-format.js';
import { loadPhotoLibrary } from './photo-library.js';

export async function selectDrivePhoto({client,demo=false}) {
  const dialog = document.createElement('dialog'); dialog.className = 'drive-picker';
  dialog.setAttribute('aria-labelledby','drive-picker-title');
  dialog.innerHTML = `<div class="dialog-header"><div><span class="eyebrow">FOTO PONDOK</span><h2 id="drive-picker-title">${demo ? 'Pratinjau perpustakaan foto' : 'Ambil foto dari Drive'}</h2></div><button type="button" class="icon-button" data-drive-close aria-label="Tutup pilihan foto">×</button></div><div class="drive-picker-body"><p class="muted">${demo ? 'Mode demo memakai foto lokal. Tidak ada foto yang dikirim ke Google.' : 'Pilih foto yang sudah tersimpan di perpustakaan akun pondok.'}</p><div class="drive-picker-tools"><input type="search" placeholder="Cari foto atau kegiatan…" aria-label="Cari foto Drive" /><button type="button" class="button secondary" data-drive-search>Cari</button></div><p data-drive-status role="status"></p><div class="drive-photo-grid"></div><div class="pagination"><span data-drive-page></span><div><button type="button" class="button secondary compact" data-drive-prev>← Sebelumnya</button><button type="button" class="button secondary compact" data-drive-next>Berikutnya →</button></div></div><a data-drive-folder class="text-link" target="_blank" rel="noopener noreferrer" hidden>Buka folder di Google Drive ↗</a></div>`;
  document.body.append(dialog); dialog.showModal();
  let photos = [],cursor='',next='',previous=[],sequence=0,closed=false,answer;
  const result = new Promise(resolve=>{answer=resolve;});
  const $ = selector => dialog.querySelector(selector);
  const finish = photo => { if (closed) return; closed=true; sequence++; dialog.close(); dialog.remove(); answer(photo); };
  const api = demo ? null : createDriveMedia(client);
  const render = async () => {
    const request=++sequence; $('[data-drive-status]').textContent='Memuat foto…'; $('.drive-photo-grid').replaceChildren();
    $('[data-drive-next]').disabled=$('[data-drive-prev]').disabled=true;
    try {
      const search=$('input').value.trim();
      if (demo) {
        const all=(await loadPhotoLibrary()).filter(row=>`${row.filename} ${row.folder}`.toLowerCase().includes(search.toLowerCase()));
        const offset=Number(cursor || 0); photos=all.slice(offset,offset+12);next=offset+12<all.length ? String(offset+12) : '';
      } else {
        const reply=await api.list({search,cursor}); if (closed || request!==sequence) return;
        photos=reply.photos;next=reply.cursor;
        const link=$('[data-drive-folder]');link.href=reply.folderUrl;link.hidden=false;
      }
      if (closed || request!==sequence) return;
      $('.drive-photo-grid').innerHTML=photos.map(row=>`<button type="button" data-drive-photo="${esc(row.id)}"><img src="${esc(row.thumbnail)}" alt="" loading="lazy" decoding="async" /><span>${esc(row.filename)}</span><small>${esc(row.folder)}</small></button>`).join('');
      $('[data-drive-status]').textContent=photos.length ? 'Klik foto untuk menggunakannya.' : 'Belum ada foto yang cocok. Unggah foto atau gunakan kata kunci lain.';
      $('[data-drive-page]').textContent=`Halaman ${previous.length+1}`;
      $('[data-drive-prev]').disabled=!previous.length;$('[data-drive-next]').disabled=!next;
    } catch(error) { if (!closed && request===sequence) { $('[data-drive-status]').textContent=error.message; $('[data-drive-prev]').disabled=!previous.length; } }
  };
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null);});
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-drive-close'))return finish(null);
    if(button.dataset.drivePhoto)return finish(photos.find(row=>row.id===button.dataset.drivePhoto));
    if(button.hasAttribute('data-drive-search')){cursor='';previous=[];return render();}
    if(button.hasAttribute('data-drive-next')&&next){previous.push(cursor);cursor=next;return render();}
    if(button.hasAttribute('data-drive-prev')&&previous.length){cursor=previous.pop();return render();}
  });
  $('input').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();cursor='';previous=[];render();}});
  await render(); return result;
}
