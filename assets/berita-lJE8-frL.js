import{C as e,S as t,w as n}from"./site-content-BkEmymUy.js";import{r}from"./photos-BW6EAMCN.js";import{supabase as i}from"./supabase-HBzNintJ.js";import{t as a}from"./category-cards-B5CLikQJ.js";var o=[],s=null,c=``;function l(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function u(e){return new Date(e).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`})}function d(t){return e(t)}function f(e,n=150){let r=t(e);return r.length>n?r.slice(0,n).trimEnd()+`…`:r}function p(e){let t=/^[\w-]{11}$/.test(e.youtube_id||``)?e.youtube_id:``,i=t?`https://img.youtube.com/vi/${t}/hqdefault.jpg`:``;return{youtube:t,slug:String(e.id),category:l(e.kategori),title:l(e.judul),date:u(e.dibuat_pada),img:l(n(e.gambar_url)||i||r.hero.berita),thumbnail:l(n(e.thumbnail_url)||n(e.gambar_url)||i||r.hero.berita),caption:l(e.caption||``),excerpt:l(f(e.isi)),content:d(e.isi)}}function m(e){return`
    <article class="news-card" data-category="${e.category}" data-slug="${e.slug}">
      <div class="news-card-img">
        <img src="${e.thumbnail}" alt="${e.title}" loading="lazy" />
        ${e.youtube?`<span class="news-video-tag">▶ Video YouTube</span>`:``}
      </div>
      <div class="news-card-body">
        <span class="badge">${e.category}</span>
        <h3 class="news-card-title">${e.title}</h3>
        <div class="news-card-date">${e.date}</div>
        <p class="news-card-excerpt">${e.excerpt}</p>
        <a href="#" class="card-link" onclick="event.preventDefault();showArticle('${e.slug}')">Baca selengkapnya <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
      </div>
    </article>
  `}function h(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${r.hero.berita}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">BERITA & KEGIATAN</span>
        <h1 style="font-size: 44px">Kabar Terbaru</h1>
        <p class="hero-subtitle">Ikuti perkembangan kegiatan dan pencapaian santri Pesantren An-Nahl.</p>
      </div>
    </section>

    <!-- Articles Grid -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <!-- Filter -->
        ${a(`news`)}

        <p id="news-status" class="category-status" role="status"></p>

        <div class="grid-3" id="news-grid">
          <p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Memuat berita...</p>
        </div>
      </div>
    </section>

    <!-- Article Detail Modal -->
    <dialog id="article-modal" class="article-modal" aria-labelledby="article-detail-title" onclick="if(event.target===this)closeArticle()">
      <div class="article-modal-content">
        <div class="article-modal-header"><span>Berita An-Nahl</span><button type="button" class="article-modal-close" aria-label="Tutup berita" onclick="closeArticle()" autofocus>&times;</button></div>
        <div id="article-modal-body" tabindex="0" role="region" aria-label="Isi berita"></div>
      </div>
    </dialog>
  `}if(!document.getElementById(`berita-styles`)){let e=document.createElement(`style`);e.id=`berita-styles`,e.textContent=`
    .article-modal {
      display: none;
      position: fixed;
      inset: 0;
      width: 100%;
      max-width: none;
      height: 100dvh;
      max-height: none;
      margin: 0;
      border: 0;
      background: transparent;
      z-index: 2000;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 24px 20px;
    }
    .article-modal[open] { display: flex; }
    .article-modal::backdrop { background:rgba(5,25,13,.6); backdrop-filter:blur(4px); }
    .article-modal-content {
      display: flex;
      flex-direction: column;
      background: var(--white);
      border-radius: var(--radius-lg);
      max-width: 800px;
      width: 100%;
      position: relative;
      max-height: calc(100dvh - 48px);
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0,0,0,0.2);
      animation: slideUp 0.4s var(--ease-out);
    }
    .article-modal-header { display:flex; flex:none; justify-content:space-between; align-items:center; gap:12px; padding:8px 14px 8px 22px; border-bottom:1px solid var(--neutral-200); background:var(--white); }
    .article-modal-header>span { font-size:13px; font-weight:600; color:var(--green-900); }
    #article-modal-body { min-height:0; overflow-y:auto; overscroll-behavior:contain; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .article-modal-close {
      position: static;
      font-size: 32px;
      color: var(--neutral-500);
      background: var(--green-50);
      border: none;
      cursor: pointer;
      z-index: 10;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    .article-modal-close:hover {
      background: var(--neutral-100);
      color: var(--neutral-950);
    }
    .article-detail-cover {
      width: 100%;
      display: block;
      height: auto;
      max-height: min(48dvh, 420px);
      object-fit: contain;
      background: var(--neutral-50);
    }
    .article-detail-video { display:block; width:100%; aspect-ratio:16/9; border:0; background:#0a1710; }
    .article-detail-body {
      padding: 28px 32px;
    }
    .article-detail-body h2 {
      font-size: 28px;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .article-detail-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .article-detail-body h3 {
      margin-top: 28px;
      margin-bottom: 12px;
      font-size: 20px;
      color: var(--green-900);
    }
    .article-detail-body p {
      color: var(--neutral-700);
      line-height: 1.8;
      margin-bottom: 16px;
      font-size: 16px;
    }
    .article-detail-body ul {
      color: var(--neutral-700);
      line-height: 1.8;
      font-size: 16px;
    }
    .article-related {
      border-top: 1px solid var(--neutral-200);
      padding: 24px 40px;
    }
    .news-card[data-hidden="true"] { display: none; }
    @media (max-width: 768px) {
      .article-detail-body { padding: 24px; }
      .article-detail-body h2 { font-size: 22px; }
      .article-modal { padding: 12px; }
      .article-modal-content { max-height: calc(100dvh - 24px); }
      .article-related { padding: 20px 24px; }
    }
    @media(prefers-reduced-motion:reduce) { .article-modal-content { animation:none; } }
  `,document.head.appendChild(e)}window.showArticle=function(e){let t=o.find(t=>t.slug===e);if(!t)return;let n=o.filter(n=>n.slug!==e&&n.category===t.category).slice(0,2),r=document.getElementById(`article-modal`);document.getElementById(`article-modal-body`).innerHTML=`
    ${t.youtube?`<iframe class="article-detail-video" src="https://www.youtube-nocookie.com/embed/${t.youtube}" title="${t.title}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`:`<img src="${t.img}" alt="${t.title}" class="article-detail-cover" />`}
    <div class="article-detail-body">
      <span class="badge">${t.category}</span>
      <h2 id="article-detail-title">${t.title}</h2>
      <div class="article-detail-meta">
        <span style="font-size:14px;color:var(--neutral-500)">${t.date}</span>
      </div>
      ${t.caption?`<p class="photo-caption">${t.caption}</p>`:``}
      ${t.content}
    </div>
    ${n.length?`
      <div class="article-related">
        <h3 style="font-size:16px;margin-bottom:16px;color:var(--neutral-950)">Artikel Terkait</h3>
        ${n.map(e=>`
          <a href="#" onclick="event.preventDefault();showArticle('${e.slug}')" style="display:flex;gap:12px;align-items:center;padding:8px 0;text-decoration:none;border-bottom:1px solid var(--neutral-100)">
            <img src="${e.img}" alt="${e.title}" style="width:60px;height:45px;object-fit:cover;border-radius:6px" loading="lazy" />
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--neutral-950);line-height:1.3">${e.title}</div>
              <div style="font-size:12px;color:var(--neutral-500)">${e.date}</div>
            </div>
          </a>
        `).join(``)}
      </div>
    `:``}
  `,document.getElementById(`article-modal-body`).scrollTop=0,r.open||(s=document.activeElement,c=document.body.style.overflow,r.showModal(),r.classList.add(`open`),document.body.style.overflow=`hidden`)};function g(e){let t=e.classList.contains(`open`);e.classList.remove(`open`),e.querySelector(`#article-modal-body`)?.replaceChildren(),t&&(document.body.style.overflow=c,s?.isConnected&&s.focus({preventScroll:!0}),s=null)}window.closeArticle=function(){let e=document.getElementById(`article-modal`);e&&(e.open&&e.close(),g(e))},window.initNewsFilter=async function(){let e=document.getElementById(`news-grid`);if(!e)return;let t=document.getElementById(`article-modal`);t.addEventListener(`cancel`,e=>{e.preventDefault(),window.closeArticle()}),t.addEventListener(`close`,()=>g(t)),e.addEventListener(`click`,e=>{if(e.defaultPrevented)return;let t=e.target.closest(`[data-slug]`);t&&window.showArticle(t.dataset.slug)});let n=`Semua`,r=()=>{let t=0;e.querySelectorAll(`.news-card[data-category]`).forEach(e=>{let r=n===`Semua`||e.dataset.category===n;e.dataset.hidden=String(!r),r&&t++});let r=document.getElementById(`news-status`);r&&(r.textContent=!t&&o.length?`Belum ada berita kategori ${n}.`:``)},a=document.querySelectorAll(`.news-filter`);if(a.forEach(e=>e.addEventListener(`click`,()=>{a.forEach(t=>t.setAttribute(`aria-pressed`,String(t===e))),n=e.dataset.filter,r()})),!i){e&&(e.innerHTML=`<p>Berita pesantren akan tersedia setelah layanan terhubung.</p>`);return}let{data:s,error:c}=await i.from(`berita`).select(`*`).eq(`status`,`published`).is(`deleted_at`,null).order(`dibuat_pada`,{ascending:!1});document.getElementById(`news-grid`)===e&&(c?(console.error(c),e.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Gagal memuat berita. Silakan coba lagi nanti.</p>`):(o=s.map(p),o.length===0?e.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Belum ada berita.</p>`:(e.innerHTML=o.map(m).join(``),r(),window.lucide&&window.lucide.createIcons())))};export{h as Berita,l as escapeHtml,u as formatTanggal,f as ringkasan};