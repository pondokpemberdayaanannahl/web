import{i as e,n as t,r as n}from"./content-format-CtCzfUOR.js";import{supabase as r}from"./supabase-HBzNintJ.js";import{r as i}from"./photos-BW6EAMCN.js";var a=[];function o(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function s(e){return new Date(e).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`})}function c(e){return n(e)}function l(e,n=150){let r=t(e);return r.length>n?r.slice(0,n).trimEnd()+`…`:r}function u(t){return{slug:String(t.id),category:o(t.kategori),title:o(t.judul),date:s(t.dibuat_pada),img:o(e(t.gambar_url)||i.hero.berita),thumbnail:o(e(t.thumbnail_url)||e(t.gambar_url)||i.hero.berita),caption:o(t.caption||``),excerpt:o(l(t.isi)),content:c(t.isi)}}function d(e){return`
    <article class="news-card" data-category="${e.category}" data-slug="${e.slug}">
      <div class="news-card-img">
        <img src="${e.thumbnail}" alt="${e.title}" loading="lazy" />
      </div>
      <div class="news-card-body">
        <span class="badge">${e.category}</span>
        <h3 class="news-card-title">${e.title}</h3>
        <div class="news-card-date">${e.date}</div>
        <p class="news-card-excerpt">${e.excerpt}</p>
        <a href="#" class="card-link" onclick="event.preventDefault();showArticle('${e.slug}')">Baca selengkapnya <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
      </div>
    </article>
  `}function f(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${i.hero.berita}')"></div>
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
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;justify-content:center;margin-bottom:var(--space-2xl)" class="reveal">
          ${[`Semua`,`Akademik`,`Keagamaan`,`Sosial`,`Pengumuman`].map((e,t)=>`
            <button class="badge news-filter" data-filter="${e}" style="cursor:pointer;border:none;font-size:14px;padding:8px 20px;${t===0?`background:var(--green-800);color:var(--white)`:``}">${e}</button>
          `).join(``)}
        </div>

        <div class="grid-3" id="news-grid">
          <p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Memuat berita...</p>
        </div>
      </div>
    </section>

    <!-- Article Detail Modal -->
    <div id="article-modal" class="article-modal" onclick="if(event.target===this)closeArticle()">
      <div class="article-modal-content">
        <button class="article-modal-close" onclick="closeArticle()">&times;</button>
        <div id="article-modal-body"></div>
      </div>
    </div>
  `}if(!document.getElementById(`berita-styles`)){let e=document.createElement(`style`);e.id=`berita-styles`,e.textContent=`
    .article-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 2000;
      align-items: flex-start;
      justify-content: center;
      overflow-y: auto;
      padding: 40px 20px;
      backdrop-filter: blur(4px);
    }
    .article-modal.open { display: flex; }
    .article-modal-content {
      background: var(--white);
      border-radius: var(--radius-lg);
      max-width: 800px;
      width: 100%;
      position: relative;
      margin-top: 40px;
      margin-bottom: 40px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.2);
      animation: slideUp 0.4s var(--ease-out);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .article-modal-close {
      position: absolute;
      top: 16px;
      right: 20px;
      font-size: 32px;
      color: var(--neutral-500);
      background: none;
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
      aspect-ratio: 16/9;
      object-fit: cover;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }
    .article-detail-body {
      padding: 40px;
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
      .article-modal { padding: 20px 12px; }
      .article-modal-content { margin-top: 20px; }
      .article-related { padding: 20px 24px; }
    }
  `,document.head.appendChild(e)}window.showArticle=function(e){let t=a.find(t=>t.slug===e);if(!t)return;let n=a.filter(n=>n.slug!==e&&n.category===t.category).slice(0,2),r=document.getElementById(`article-modal`);document.getElementById(`article-modal-body`).innerHTML=`
    <img src="${t.img}" alt="${t.title}" class="article-detail-cover" />
    <div class="article-detail-body">
      <span class="badge">${t.category}</span>
      <h2>${t.title}</h2>
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
  `,r.classList.add(`open`),document.body.style.overflow=`hidden`},window.closeArticle=function(){let e=document.getElementById(`article-modal`);e&&(e.classList.remove(`open`),document.body.style.overflow=``)},window.initNewsFilter=async function(){if(!r){let e=document.getElementById(`news-grid`);e&&(e.innerHTML=`<p>Berita pesantren akan tersedia setelah layanan terhubung.</p>`);return}let e=document.querySelectorAll(`.news-filter`);e.forEach(t=>{t.addEventListener(`click`,()=>{e.forEach(e=>{e.style.background=``,e.style.color=``}),t.style.background=`var(--green-800)`,t.style.color=`var(--white)`;let n=t.dataset.filter;document.querySelectorAll(`.news-card[data-category]`).forEach(e=>{e.dataset.hidden=n!==`Semua`&&e.dataset.category!==n?`true`:`false`})})});let{data:t,error:n}=await r.from(`berita`).select(`*`).eq(`status`,`published`).is(`deleted_at`,null).order(`dibuat_pada`,{ascending:!1}),i=document.getElementById(`news-grid`);i&&(n?(console.error(n),i.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Gagal memuat berita. Silakan coba lagi nanti.</p>`):(a=t.map(u),a.length===0?i.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Belum ada berita.</p>`:(i.innerHTML=a.map(d).join(``),window.lucide&&window.lucide.createIcons())))};export{f as Berita,o as escapeHtml,s as formatTanggal,l as ringkasan};