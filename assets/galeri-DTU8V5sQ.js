import{t as e}from"./preload-helper-DL2h9CSu.js";import{i as t,t as n}from"./content-format-CtCzfUOR.js";import{n as r,r as i,t as a}from"./photos-BW6EAMCN.js";import{t as o}from"./category-cards-GzSJdb2L.js";function s(){return`
    <section class="hero" style="min-height:50vh"><div class="hero-bg" style="background-image:url('${i.hero.galeri}')"></div><div class="hero-overlay"></div><div class="hero-content"><span class="section-label" style="color:var(--green-300)">GALERI</span><h1>Galeri Foto & Video</h1><p class="hero-subtitle">Dokumentasi kegiatan dan suasana Pesantren An-Nahl.</p></div></section>
    <section class="section"><div class="container"><div class="section-header"><span class="section-label">FOTO KEGIATAN</span><h2 class="section-title">Momen yang Terabadikan</h2></div>${o(`gallery`)}<p id="gallery-status" role="status"></p><div class="gallery-grid" id="photo-grid"></div><button id="gallery-more" class="btn btn-secondary" hidden>Muat foto lainnya</button></div></section>
    <section class="section" style="background:var(--green-50)"><div class="container"><div class="section-header"><span class="section-label">VIDEO</span><h2 class="section-title">Video Kegiatan Pesantren</h2></div><p id="video-status" role="status"></p><div class="grid-3" id="video-grid"></div><button id="video-more" class="btn btn-secondary" hidden>Muat video lainnya</button></div></section>
    <dialog id="lightbox" class="lightbox" aria-label="Pratinjau foto"><button class="lightbox-close" aria-label="Tutup foto">&times;</button><img id="lightbox-img" alt="" /><div id="lightbox-caption" class="lightbox-caption"></div></dialog>
  `}if(!document.getElementById(`galeri-styles`)){let e=document.createElement(`style`);e.id=`galeri-styles`,e.textContent=`
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-md);
    }
    .gallery-item {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      aspect-ratio: 4/3;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .gallery-item.hidden {
      display: none;
    }
    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s var(--ease-out);
    }
    .gallery-item:hover img {
      transform: scale(1.08);
    }
    .gallery-overlay {
      position: absolute;
      inset: 0;
      background: rgba(5, 46, 22, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .gallery-overlay span {
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    .gallery-item:hover .gallery-overlay {
      opacity: 1;
    }

    /* Video card */
    .video-card {
      background: var(--white);
      border: 1px solid var(--neutral-200);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all 0.35s var(--ease-out);
      box-shadow: var(--shadow-sm);
    }
    .video-card:hover {
      border-color: var(--green-200);
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);
    }
    .video-thumbnail {
      position: relative;
      aspect-ratio: 16/9;
      cursor: pointer;
      overflow: hidden;
      background: var(--neutral-950);
    }
    .video-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease, opacity 0.4s ease;
      opacity: 0.85;
    }
    .video-thumbnail:hover img {
      transform: scale(1.05);
      opacity: 0.7;
    }
    .video-play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(5, 46, 22, 0.7);
      border-radius: 50%;
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    }
    .video-thumbnail:hover .video-play-btn {
      background: var(--green-800);
      transform: translate(-50%, -50%) scale(1.1);
    }

    /* Lightbox */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      z-index: 2000;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 40px;
    }
    .lightbox.open { display: flex; }
    .lightbox img {
      max-width: 90vw;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
    }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 30px;
      font-size: 36px;
      color: white;
      background: none;
      border: none;
      cursor: pointer;
      z-index: 2001;
      transition: transform 0.2s ease;
    }
    .lightbox-close:hover {
      transform: scale(1.2);
    }
    .lightbox-caption {
      color: rgba(255,255,255,0.7);
      margin-top: 16px;
      font-size: 15px;
    }

    @media (max-width: 768px) {
      .gallery-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .gallery-grid { grid-template-columns: 1fr; }
    }
  `,document.head.appendChild(e)}var c=e=>{let i=t(e.gambar_url||e.src),a=t(e.thumbnail_url||r(i));if(!i||!a)return``;let o=e.judul||e.alt||`Foto kegiatan`;return`<button type="button" class="gallery-item" data-full="${n(i)}" data-caption="${n(e.caption||o)}" aria-label="Buka foto ${n(o)}"><img src="${n(a)}" alt="${n(o)}" loading="lazy" decoding="async" /><span class="gallery-overlay"><span>${n(o)}</span></span></button>`},l=e=>/^[\w-]{11}$/.test(e.youtube_id||``)?`<article class="video-card"><button type="button" class="video-thumbnail" data-video="${e.youtube_id}" data-title="${n(e.judul)}" aria-label="Putar ${n(e.judul)}"><img src="https://img.youtube.com/vi/${e.youtube_id}/mqdefault.jpg" alt="" loading="lazy" /><span class="video-play-btn" aria-hidden="true">▶</span></button><div style="padding:24px"><span class="badge">${n(e.kategori)}</span><h3>${n(e.judul)}</h3></div></article>`:``;window.openLightbox=function(e,n){let r=document.getElementById(`lightbox`);r&&t(e)&&(document.getElementById(`lightbox-img`).src=e,document.getElementById(`lightbox-img`).alt=n,document.getElementById(`lightbox-caption`).textContent=n,r.classList.add(`open`),r.showModal(),document.body.style.overflow=`hidden`)},window.closeLightbox=function(){let e=document.getElementById(`lightbox`);e&&(e.close(),e.classList.remove(`open`),document.body.style.overflow=``,document.getElementById(`lightbox-img`).removeAttribute(`src`))},window.initGalleryFilter=async function(){let t=document.getElementById(`photo-grid`),n=document.getElementById(`video-grid`);if(!t||!n)return;let r=`Semua`,i=0,o=0,s=0,u=document.getElementById(`gallery-status`),d=document.getElementById(`video-status`),f=document.getElementById(`gallery-more`),p=document.getElementById(`video-more`),{supabase:m}=await e(async()=>{let{supabase:e}=await import(`./supabase-HBzNintJ.js`);return{supabase:e}},[]);if(!t.isConnected)return;async function h(e=!1){let n=++s;e&&(i=0,t.replaceChildren()),u.textContent=`Memuat foto…`,f.disabled=!0;try{let e,o;if(m){let t=m.from(`galeri_foto`).select(`id,judul,kategori,gambar_url,thumbnail_url,caption`,{count:`exact`}).order(`dibuat_pada`,{ascending:!1}).order(`id`);r!==`Semua`&&(t=t.eq(`kategori`,r));let n=await t.range(i,i+11);if(n.error)throw n.error;e=n.data,o=n.count||0}else{let t=a.filter(e=>r===`Semua`||e.category===r);e=t.slice(i,i+12),o=t.length}if(!t.isConnected||n!==s)return;t.insertAdjacentHTML(`beforeend`,e.map(c).join(``)),i+=e.length,f.hidden=i>=o,u.textContent=o?``:`Belum ada foto pada kategori ini.`}catch{t.isConnected&&n===s&&(u.textContent=`Foto belum dapat dimuat. Klik muat foto untuk mencoba lagi.`,f.hidden=!1)}finally{n===s&&(f.disabled=!1)}}async function g(){if(!p.disabled){p.disabled=!0,d.textContent=`Memuat video…`;try{if(!m){d.textContent=`Video kegiatan belum tersedia.`;return}let{data:e,count:t,error:r}=await m.from(`galeri_video`).select(`id,judul,kategori,youtube_id`,{count:`exact`}).order(`dibuat_pada`,{ascending:!1}).order(`id`).range(o,o+5);if(r)throw r;if(!n.isConnected)return;n.insertAdjacentHTML(`beforeend`,e.map(l).join(``)),o+=e.length,p.hidden=o>=t,d.textContent=t?``:`Video kegiatan belum tersedia.`}catch{n.isConnected&&(d.textContent=`Video belum dapat dimuat. Klik muat video untuk mencoba lagi.`,p.hidden=!1)}finally{p.disabled=!1}}}document.querySelectorAll(`.gallery-filter`).forEach(e=>e.addEventListener(`click`,()=>{r=e.dataset.filter,document.querySelectorAll(`.gallery-filter`).forEach(t=>t.setAttribute(`aria-pressed`,String(t===e))),h(!0)})),f.addEventListener(`click`,()=>h()),p.addEventListener(`click`,g),t.addEventListener(`click`,e=>{let t=e.target.closest(`[data-full]`);t&&window.openLightbox(t.dataset.full,t.dataset.caption)});let _=document.getElementById(`lightbox`);_.querySelector(`button`).addEventListener(`click`,window.closeLightbox),_.addEventListener(`cancel`,e=>{e.preventDefault(),window.closeLightbox()}),_.addEventListener(`click`,e=>{e.target===_&&window.closeLightbox()}),n.addEventListener(`click`,e=>{let t=e.target.closest(`[data-video]`);if(!t)return;let n=document.createElement(`iframe`);n.src=`https://www.youtube-nocookie.com/embed/${t.dataset.video}?autoplay=1`,n.title=t.dataset.title,n.allow=`autoplay; encrypted-media; fullscreen`,n.allowFullscreen=!0,n.style.cssText=`width:100%;aspect-ratio:16/9;border:0;display:block`,t.replaceWith(n)}),await Promise.all([h(!0),g()])};export{s as Galeri};