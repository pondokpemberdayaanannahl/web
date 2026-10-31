import { createRequire } from 'node:module';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createServer } from '../node_modules/vite/dist/node/index.js';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {expect}=require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test.js');
process.env.VITE_DUMMY_LOGIN_ENABLED='true';process.env.VITE_DUMMY_USERNAME='admin';process.env.VITE_DUMMY_PASSWORD='123';
process.env.VITE_SUPABASE_URL='https://abcdefghijklmnopqrst.supabase.co';process.env.VITE_SUPABASE_ANON_KEY='sb_publishable_fixture';
const vite=await createServer({configFile:'vite.config.js',logLevel:'silent',server:{host:'127.0.0.1',port:0,open:false}});await vite.listen();
const origin=`http://127.0.0.1:${vite.httpServer.address().port}`;
await mkdir('tmp/home-updates-browser',{recursive:true});
const image='/media/78c6f97a9f7e7c1c-1600.jpg';
const news=[{id:'n1',judul:'Cerita kegiatan terbaru',kategori:'Keagamaan',isi:'Kegiatan bersama santri.\n\nBelajar dan berbagi cerita.',gambar_url:image,thumbnail_url:image,status:'published',deleted_at:null,dibuat_pada:'2026-10-30T12:00:00Z'},{id:'n2',judul:'Berita lebih lama',kategori:'Akademik',isi:'Kabar lama.',gambar_url:image,status:'published',deleted_at:null,dibuat_pada:'2026-09-01T00:00:00Z'}];
const photos=[{id:'p1',judul:'Momen keseharian pondok',kategori:'Acara',caption:'Dokumentasi kegiatan para santri.',gambar_url:image,dibuat_pada:'2026-10-31T12:00:00Z'},{id:'p2',judul:'Dokumentasi sebelumnya',kategori:'Acara',gambar_url:image,dibuat_pada:'2026-10-29T12:00:00Z'}];
const videos=[{id:'v1',judul:'Video kegiatan pondok',kategori:'Kegiatan',youtube_id:'abcdefghijk',dibuat_pada:'2026-10-31T13:00:00Z'}];
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const results=[];
try{
 for(const width of process.env.QA_WIDTHS?process.env.QA_WIDTHS.split(',').map(Number):[1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await context.route('**/rest/v1/**',async route=>{
   const url=new URL(route.request().url());const table=url.pathname.split('/').at(-1);
   let data=table==='berita'?news:table==='galeri_foto'?photos:table==='galeri_video'?videos:[];
   if(table==='berita'){assert.equal(url.searchParams.get('status'),'eq.published');assert.equal(url.searchParams.get('deleted_at'),'is.null');}
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data),headers:{'Access-Control-Allow-Origin':'*'}});
  });
  await context.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>Video player fixture</p>'}));
  await page.goto(origin+'/#/',{waitUntil:'networkidle'});
  await expect(page.locator('#home-stories-grid .story-card')).toHaveCount(4);
  assert.deepEqual(await page.locator('#home-stories-grid .news-card-title').allTextContents(),['Video kegiatan pondok','Momen keseharian pondok','Cerita kegiatan terbaru','Dokumentasi sebelumnya']);
  assert.equal(await page.evaluate(()=>document.getElementById('about').compareDocumentPosition(document.getElementById('stories'))&Node.DOCUMENT_POSITION_FOLLOWING?!!(document.getElementById('stories').compareDocumentPosition(document.getElementById('programs'))&Node.DOCUMENT_POSITION_FOLLOWING):false),true);
  await page.locator('#stories').scrollIntoViewIfNeeded();await page.locator('#stories').screenshot({path:`tmp/home-updates-browser/stories-${width}.png`});
  for(const key of ['berita:n1','foto:p1','video:v1']){
   await page.locator(`[data-story="${key}"]`).first().click();await expect(page.locator('#story-dialog')).toBeVisible();
   if(key.startsWith('video'))await expect(page.locator('#story-dialog iframe')).toHaveAttribute('src','https://www.youtube-nocookie.com/embed/abcdefghijk');
   else await expect(page.locator('#story-dialog img')).toBeVisible();
   await page.locator('[data-story-close]').click();await expect(page.locator('#story-dialog')).not.toBeVisible();
   assert.equal(await page.locator('#story-dialog-body').innerHTML(),'');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.goto(origin+'/#/pendaftaran',{waitUntil:'networkidle'});
  await expect(page.locator('.registration-bank')).toContainText('0000 0000 0000');await expect(page.locator('.registration-bank')).toContainText('Jangan melakukan transfer');
  await page.locator('.registration-bank').scrollIntoViewIfNeeded();await page.locator('.registration-bank').screenshot({path:`tmp/home-updates-browser/bank-${width}.png`});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))console.log(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,id:el.id,cls:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).slice(0,18))));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.goto(origin+'/login.html',{waitUntil:'networkidle'});await page.locator('#username').fill('admin');await page.locator('#password').fill('123');await page.locator('#login-btn').click();await page.waitForURL('**/admin.html');
  await page.locator('[data-panel="halaman"]').click();await page.locator('[data-cms-page="beranda"]').click();await page.locator('[data-cms-block]').nth(1).click();
  const heading=page.locator('#cms-fields [data-cms-field]').first();await heading.fill('Judul pratinjau sebelum disimpan');
  await page.locator('#cms-fields [data-cms-upload]').first().setInputFiles('public'+image);
  await expect(page.locator('#toast')).toContainText('Foto siap');
  await page.locator('#cms-editor [data-cms-action="preview"]').click();await expect(page.locator('#cms-preview')).toBeVisible();
  const preview=page.frameLocator('#cms-preview-frame');await expect(preview.locator('#about h2')).toHaveText('Judul pratinjau sebelum disimpan');
  await expect(preview.locator('#about img')).toHaveAttribute('src',/^data:image\//);
  await expect.poll(()=>preview.locator('#about img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await page.locator('[data-cms-width="phone"]').click();assert.ok((await page.locator('#cms-preview-frame').boundingBox()).width<=390);
  await preview.locator('#about').scrollIntoViewIfNeeded();await page.locator('#cms-preview').screenshot({path:`tmp/home-updates-browser/preview-${width}.png`});
  await page.locator('[data-cms-action="close-preview"]').click();await expect(page.locator('#cms-editor')).toBeVisible();await expect(heading).toHaveValue('Judul pratinjau sebelum disimpan');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('annahl-demo-site-content-v1')),null);
  assert.equal(pageErrors.length,0,pageErrors.join('\n'));
  results.push({width,fourMixedStories:true,storyOrder:true,newsPhotoVideoDetails:true,registrationDummy:true,previewUnsavedText:true,previewLocalPhoto:true,editorPreserved:true,pageErrors});
  await context.close();
 }
 await writeFile('tmp/home-updates-browser/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();await vite.close();}
