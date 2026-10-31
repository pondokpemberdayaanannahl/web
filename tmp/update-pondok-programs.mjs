import {readFile,writeFile} from 'node:fs/promises';

let program=await readFile('src/pages/program.js','utf8');
program=program.replace("import { photos } from '../data/photos.js';","import { photos } from '../data/photos.js';\nimport { programPesantren, programUnggulan, ekstrakurikuler } from '../data/pondok.js';");
program=program.replace('Program Pendidikan Unggulan','Program Pesantren');
const start=program.indexOf('    <!-- Program Tahfidz -->');
const end=program.indexOf('    <!-- Jadwal Kegiatan -->');
if(start<0||end<start)throw Error('Program sections not found');
const replacement=`    <!-- Program Pesantren -->
    <section class="section" id="program-pesantren" style="background:var(--neutral-50)">
      <div class="container">
        <div class="section-header"><span class="section-label reveal">PROGRAM PESANTREN</span><h2 class="section-title reveal reveal-delay-1">Empat Program Pesantren</h2><p class="section-subtitle reveal reveal-delay-2">Pendidikan Al-Qur’an, madrasah, sekolah formal, dan pembinaan akhlak.</p></div>
        <div class="grid-2 pondok-program-grid">
          \${programPesantren.map((program,i) => \`<article class="card reveal reveal-delay-\${i}"><div class="card-icon"><i data-lucide="\${program.icon}" style="width:28px;height:28px"></i></div><h3 class="card-title">\${program.title}</h3><p class="card-text">\${program.description}</p></article>\`).join('')}
        </div>
      </div>
    </section>

    <!-- Program Unggulan -->
    <section class="section" id="program-unggulan" style="background:var(--green-50)">
      <div class="container">
        <div class="section-header"><span class="section-label reveal">PROGRAM UNGGULAN</span><h2 class="section-title reveal reveal-delay-1">Ilmu, Bahasa, dan Keterampilan</h2><p class="section-subtitle reveal reveal-delay-2">Empat program unggulan yang melengkapi pendidikan santri.</p></div>
        <div class="grid-4 pondok-program-grid">
          \${programUnggulan.map((program,i) => \`<article class="card reveal reveal-delay-\${i}"><div class="card-icon"><i data-lucide="\${program.icon}" style="width:28px;height:28px"></i></div><h3 class="card-title">\${program.title}</h3><p class="card-text">\${program.description}</p></article>\`).join('')}
        </div>
      </div>
    </section>

    <!-- Pembinaan Santri -->
    <section class="section" style="background:var(--neutral-50)">
      <div class="container"><div class="about-content">
        <div class="about-text"><span class="section-label reveal">PEMBINAAN SANTRI</span><h2 class="reveal reveal-delay-1">Tarbiyah Akhlak Islamiyah</h2><p class="reveal reveal-delay-2">Pembinaan akhlak menjadi bagian dari pendidikan pesantren, bersama tahfidz, madrasah muhadloroh, dan pendidikan formal SMP/SMA.</p><p class="reveal reveal-delay-3">Santri juga dapat mengembangkan minat dan keterampilan melalui kegiatan ekstrakurikuler pesantren.</p></div>
        <div class="about-image reveal"><img src="\${photos.program.pemberdayaan}" alt="Kegiatan santri An-Nahl" loading="lazy" /></div>
      </div></div>
    </section>

    <!-- Ekstrakurikuler -->
    <section class="section" id="ekstrakurikuler" style="background:var(--green-50)">
      <div class="container">
        <div class="section-header"><span class="section-label reveal">EKSTRAKURIKULER</span><h2 class="section-title reveal reveal-delay-1">Ruang untuk Minat dan Bakat</h2><p class="section-subtitle reveal reveal-delay-2">Pilihan kegiatan untuk mengembangkan kemampuan, kreativitas, dan kemandirian santri.</p></div>
        <div class="grid-3 pondok-extracurricular-grid">
          \${ekstrakurikuler.map((activity,i) => \`<article class="card extracurricular-card reveal reveal-delay-\${i%4}"><div class="card-icon"><i data-lucide="\${activity.icon}" style="width:24px;height:24px"></i></div><h3 class="card-title">\${activity.title}</h3></article>\`).join('')}
        </div>
      </div>
    </section>

`;
program=program.slice(0,start)+replacement+program.slice(end);
await writeFile('src/pages/program.js',program);

let home=await readFile('src/pages/beranda.js','utf8');
home=home.replace("import { photos } from '../data/photos.js';","import { photos } from '../data/photos.js';\nimport { programPesantren, programUnggulan } from '../data/pondok.js';");
home=home.replace('Kurikulum Terpadu untuk Generasi Unggul','Program Pesantren');
home=home.replace('Empat pilar pendidikan yang membentuk santri berilmu, berakhlak, dan berdaya.','Empat program pendidikan yang mendampingi proses belajar dan pembinaan santri.');
const gridStart=home.indexOf('        <div class="grid-4">',home.indexOf('id="programs"'));
const gridEnd=home.indexOf('        <div style="text-align:center; margin-top: var(--space-2xl)"',gridStart);
if(gridStart<0||gridEnd<gridStart)throw Error('Home program grid not found');
home=home.slice(0,gridStart)+`        <div class="grid-4 pondok-program-grid">
          \${programPesantren.map((program,i) => \`<article class="card reveal reveal-delay-\${i}"><div class="card-icon"><i data-lucide="\${program.icon}" style="width:28px;height:28px"></i></div><h3 class="card-title">\${program.title}</h3><p class="card-text">\${program.description}</p><a href="#/program" class="card-link">Pelajari lebih lanjut <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a></article>\`).join('')}
        </div>
`+home.slice(gridEnd);
const marker='    <!-- STATISTIK -->';
if(!home.includes(marker))throw Error('Home statistics not found');
home=home.replace(marker,`    <section class="section" id="featured-programs" data-content-key="home-featured-programs" style="background:var(--neutral-50)">
      <div class="container">
        <div class="section-header"><span class="section-label reveal">PROGRAM UNGGULAN</span><h2 class="section-title reveal reveal-delay-1">Ilmu, Bahasa, dan Keterampilan</h2></div>
        <div class="grid-4 pondok-program-grid">
          \${programUnggulan.map((program,i) => \`<article class="card reveal reveal-delay-\${i}"><div class="card-icon"><i data-lucide="\${program.icon}" style="width:28px;height:28px"></i></div><h3 class="card-title">\${program.title}</h3><p class="card-text">\${program.description}</p></article>\`).join('')}
        </div>
      </div>
    </section>

`+marker);
await writeFile('src/pages/beranda.js',home);
