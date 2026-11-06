import { createRequire } from 'node:module';
import { mkdir,writeFile } from 'node:fs/promises';
import { createServer } from '../node_modules/vite/dist/node/index.js';
import { defaultGalleryAlbums } from '../src/gallery-albums.js';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime='C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const {chromium}=require(runtime),{expect}=require(runtime+'/test.js');
const vite=await createServer({configFile:'vite.config.js',logLevel:'silent',server:{host:'127.0.0.1',port:0,open:false}});await vite.listen();
const base=`http://127.0.0.1:${vite.httpServer.address().port}`,browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),albums=defaultGalleryAlbums(),results=[];
await mkdir('tmp/gallery-editor-video-browser',{recursive:true});
try{
 for(const mode of ['missing-table','configured','empty']){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),requests=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://*.supabase.co/**',async route=>{
    const url=new URL(route.request().url()),headers={'Access-Control-Allow-Origin':'*','Content-Range':'*/0'};
    if(!url.pathname.endsWith('/galeri_album'))return route.fulfill({json:[],headers});
    requests.push(url.search);
    if(mode==='missing-table')return route.fulfill({status:404,json:{code:'PGRST205',message:'Fixture: album table is unavailable'},headers});
    let rows=mode==='empty' ? [] : albums;
    const category=url.searchParams.get('kategori');if(category)rows=rows.filter(album=>album.kategori===category.slice(3));
    const id=url.searchParams.get('id');if(id)return route.fulfill({json:rows.find(album=>album.id===id.slice(3)),headers});
    const data=rows.map(({photos,...summary})=>summary);
    return route.fulfill({json:data,headers:{...headers,'Content-Range':data.length ? `0-${data.length-1}/${data.length}` : '*/0'}});
  });
  await page.goto(base+'/#/galeri');await expect(page.locator('#album-grid .album-card')).toHaveCount(mode==='empty' ? 0 : 4);
  await expect(page.locator('#album-more')).toBeHidden();
  if(mode==='empty'){await expect(page.locator('#gallery-status')).toHaveText('Belum ada foto pada kategori ini.');}
  else{
    await expect(page.locator('#gallery-status')).toHaveText('');await page.locator('.gallery-filter[data-filter="Akademik"]').click();await expect(page.locator('#album-grid .album-card')).toHaveCount(1);
    await page.locator('#album-grid .album-cover').click();await expect(page.locator('.album-viewer[open] .album-thumbnails button')).toHaveCount(3);await expect(page.locator('.album-viewer[open] .album-story')).toContainText('belajar');await page.locator('.album-viewer[open] [data-album-close]').click();
  }
  assert.ok(requests.length>0);assert.deepEqual(errors,[]);results.push({mode,albums:mode==='empty' ? 0 : 4,publicRequest:true,detailRead:mode==='configured'});await context.close();console.log(`PASS public ${mode}: correct album source, visibility and filter.`);
 }
 await writeFile('tmp/gallery-editor-video-browser/live-source-results.json',JSON.stringify(results,null,2));
}finally{await browser.close();await vite.close();}
