// Regenerate the standalone manual: node scripts/build-user-manual.mjs
// This renderer supports the Markdown subset used by USER_MANUAL.md.
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('USER_MANUAL.md', root), 'utf8');
const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const inline = text => {
  const saved = [];
  const keep = html => `\u0000${saved.push(html) - 1}\u0000`;
  let output = text.replace(/`([^`]+)`/g, (_, code) => keep(`<code>${escape(code)}</code>`));
  output = escape(output)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${href}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\\\*/g, '*');
  return output.replace(/\u0000(\d+)\u0000/g, (_, index) => saved[Number(index)]);
};
const lines = source.replace(/\r/g, '').trim().split('\n');
const body = [], contents = [];
let index = 0, section = false;
while (index < lines.length) {
  const line = lines[index];
  if (!line.trim()) { index++; continue; }
  const heading = line.match(/^(#{1,3}) (.+)$/);
  if (heading) {
    const depth = heading[1].length, title = heading[2];
    const id = depth === 2 ? `bagian-${title.match(/^\d+/)?.[0]}` : depth === 1 ? 'awal' : `sub-${index}`;
    if (depth === 2) {
      if (section) body.push('</section>');
      body.push(`<section aria-labelledby="${id}">`); section = true;
      contents.push(`<a href="#${id}">${inline(title)}</a>`);
    }
    body.push(`<h${depth} id="${id}">${inline(title)}</h${depth}>`);
    index++; continue;
  }
  if (line.startsWith('|')) {
    const cells = row => row.trim().slice(1, -1).split('|').map(cell => cell.trim());
    const headings = cells(line);
    if (!/^\|[\s:|\-]+\|$/.test(lines[index + 1] || '')) throw new Error(`Invalid table at line ${index + 1}`);
    body.push('<div class="table-wrap" tabindex="0" role="region" aria-label="Tabel panduan"><table><thead><tr>' + headings.map(cell => `<th scope="col">${inline(cell)}</th>`).join('') + '</tr></thead><tbody>');
    index += 2;
    while (index < lines.length && lines[index].startsWith('|')) {
      const row = cells(lines[index]);
      if (row.length !== headings.length) throw new Error(`Table column mismatch at line ${index + 1}`);
      body.push('<tr>' + row.map(cell => `<td>${inline(cell)}</td>`).join('') + '</tr>'); index++;
    }
    body.push('</tbody></table></div>'); continue;
  }
  const list = line.match(/^(?:([-]) |(\d+)\. )(.+)$/);
  if (list) {
    const tag = list[1] ? 'ul' : 'ol';
    body.push(`<${tag}>`);
    while (index < lines.length) {
      const item = lines[index].match(tag === 'ul' ? /^- (.+)$/ : /^\d+\. (.+)$/);
      if (!item) break;
      body.push(`<li>${inline(item[1])}</li>`); index++;
    }
    body.push(`</${tag}>`); continue;
  }
  const paragraph = [];
  while (index < lines.length && lines[index].trim() && !/^(#{1,3} |\||- |\d+\. )/.test(lines[index])) {
    paragraph.push(inline(lines[index].trimEnd()) + (lines[index].endsWith('  ') ? '<br>' : '')); index++;
  }
  body.push(`<p>${paragraph.join(' ')}</p>`);
}
if (section) body.push('</section>');
const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Panduan lengkap website An-Nahl untuk pengunjung, wali santri, donatur, Penulis, dan Admin. Edisi 30 Oktober 2026.">
<title>Panduan Pengguna Website An-Nahl — 30 Oktober 2026</title>
<style>
:root{color-scheme:light;--green:#166534;--ink:#20342a;--muted:#526158;--line:#dce6dd;--paper:#fff;--wash:#f3f7f2}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--wash);color:var(--ink);font:16px/1.75 "Segoe UI",Arial,sans-serif}a{color:var(--green);text-underline-offset:3px}a:hover{text-decoration-thickness:2px}a:focus-visible,button:focus-visible,summary:focus-visible,.table-wrap:focus-visible{outline:3px solid #b87513;outline-offset:4px}.skip{position:absolute;top:-100px;left:16px;background:white;padding:10px;z-index:10}.skip:focus{top:12px}
.masthead{background:#104d2b;color:white;padding:42px max(28px,calc((100vw - 1250px)/2));border-bottom:5px solid #b9d19e}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700;text-transform:uppercase;color:#d1e7c7}.masthead-title{font-size:clamp(25px,3vw,39px);font-weight:700;letter-spacing:-.6px;line-height:1.25;margin:12px 0}.masthead p{margin:8px 0 0;color:#e0ede0;max-width:700px}.layout{max-width:1300px;margin:auto;display:grid;grid-template-columns:275px minmax(0,1fr);gap:36px;padding:34px 26px 64px}aside{align-self:start;position:sticky;top:20px;max-height:calc(100vh - 40px);overflow-y:auto;padding:0 12px 18px 0}summary{font-weight:700;color:#104d2b;font-size:17px;cursor:pointer;padding:0 0 12px}.toc{display:flex;flex-direction:column;gap:2px}.toc a{display:block;text-decoration:none;font-size:13px;line-height:1.5;padding:7px 10px;border-radius:7px;color:#334f3c}.toc a:hover{background:#e1ecde}.tools{margin:18px 0 0;padding-top:16px;border-top:1px solid #ccdacc;font-size:12px;color:var(--muted)}.tools a{display:block;margin:5px 0}main{min-width:0;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:40px 46px;box-shadow:0 8px 35px #153b2110}h1{font-size:32px;line-height:1.25;letter-spacing:-.7px;color:#104d2b;margin:0 0 20px}h2{font-size:25px;line-height:1.35;letter-spacing:-.3px;color:#104d2b;margin:0 0 18px}h3{font-size:18px;line-height:1.5;color:#1d5b32;margin:26px 0 10px}p{margin:0 0 16px}section{border-top:1px solid var(--line);padding-top:30px;margin-top:32px}li{padding-left:3px;margin-bottom:9px}ul,ol{padding-left:25px;margin:12px 0 22px}strong{color:#163d25}code{font: .9em/1.5 Consolas,monospace;background:#eef4ec;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}.table-wrap{overflow-x:auto;margin:18px 0 24px;border:1px solid var(--line);border-radius:9px}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.65}th{text-align:left;background:#eaf2e6;color:#194f2d;font-weight:700;padding:12px 14px;border-bottom:1px solid #cfddc9}td{vertical-align:top;padding:12px 14px;border-bottom:1px solid #e5ece2}tr:last-child td{border-bottom:0}tbody tr:nth-child(even){background:#fafcf8}td:first-child{min-width:130px;width:29%}td a{overflow-wrap:anywhere}footer{font-size:12px;color:var(--muted);margin:36px 0 0;padding-top:20px;border-top:1px solid var(--line)}
@media(max-width:900px){.layout{grid-template-columns:220px minmax(0,1fr);gap:20px;padding:24px 18px}main{padding:28px}body{font-size:15px}}
@media(max-width:700px){.masthead{padding:28px 20px}.layout{display:block;padding:18px 12px 36px}aside{position:static;max-height:none;padding:0;margin:0 0 18px}aside details{background:white;border:1px solid var(--line);border-radius:12px;padding:15px}aside .toc{max-height:300px;overflow-y:auto}.tools{display:none}summary{font-size:15px;padding-bottom:8px}main{padding:24px 18px;border-radius:12px}h1{font-size:26px}h2{font-size:21px}h3{font-size:17px}table{font-size:13px}th,td{padding:10px}td:first-child{min-width:105px}section{margin-top:26px;padding-top:25px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@page{size:A4;margin:18mm 16mm}
@media print{body{background:white;font:10pt/1.5 "Segoe UI",Arial,sans-serif;color:#17251c}.skip,.tools{display:none}.masthead{padding:0 0 8mm;background:white;color:#104d2b;border-bottom:2pt solid #166534}.masthead .eyebrow,.masthead p{color:#334f3c}.masthead-title{font-size:23pt}.layout{display:block;padding:0;max-width:none}aside{position:static;max-height:none;overflow:visible;margin:7mm 0;padding:0;break-after:page}aside summary{display:block;font-size:15pt}aside .toc{display:block;columns:2;column-gap:8mm;max-height:none;overflow:visible}.toc a{font-size:9pt;line-height:1.4;padding:2mm 0;break-inside:avoid}main{padding:0;border:0;border-radius:0;box-shadow:none}h1{font-size:22pt}h2{font-size:16pt}h3{font-size:12pt}h1,h2,h3{break-after:avoid}section{padding-top:6mm;margin-top:7mm}p,li{orphans:3;widows:3}.table-wrap{overflow:visible;border-radius:0}table{font-size:9pt}thead{display:table-header-group}tr{break-inside:avoid}th,td{padding:2mm 2.5mm}a{color:inherit}code{white-space:normal}footer{font-size:9pt}}
</style>
</head>
<body>
<a class="skip" href="#isi-panduan">Langsung ke isi panduan</a>
<header class="masthead"><span class="eyebrow">An-Nahl • Panduan Pengguna</span><div class="masthead-title">Semua fitur, langkah demi langkah.</div><p>Untuk pengunjung, wali santri, donatur, Penulis, dan Admin.<br>Edisi 1.0 · Diperiksa dari proyek lokal per 30 Oktober 2026.</p></header>
<div class="layout">
<aside aria-label="Navigasi panduan"><details open><summary>Daftar isi</summary><nav class="toc" aria-label="Daftar isi">${contents.join('\n')}</nav></details><div class="tools">Cari dalam panduan: <strong>Ctrl+F</strong><br>Cetak / simpan PDF: <strong>Ctrl+P</strong><a href="USER_MANUAL.md">Buka sumber Markdown</a><a href="#awal">Kembali ke awal ↑</a></div></aside>
<main id="isi-panduan">${body.join('\n')}<footer>Panduan Pengguna Website An-Nahl · Edisi 1.0 · 30 Oktober 2026<br>Dokumen ini dapat dibaca secara offline. Fitur website dan tautan layanan luar memerlukan koneksi internet.</footer></main>
</div>
</body>
</html>
`;
await writeFile(new URL('USER_MANUAL.html', root), html, 'utf8');
console.log(`USER_MANUAL.html generated: ${contents.length} sections, ${Buffer.byteLength(html).toLocaleString('id-ID')} bytes.`);
