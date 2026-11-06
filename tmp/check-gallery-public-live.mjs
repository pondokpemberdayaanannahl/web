import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { loadEnv } from '../node_modules/vite/dist/node/index.js';
import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';
import { writeFile } from 'node:fs/promises';
const env=loadEnv('production',process.cwd(),'VITE_SUPABASE_');
assert.equal(new URL(env.VITE_SUPABASE_URL).hostname,'cbzvezwdbinbzwsqqlcz.supabase.co');
const client=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const albums=await client.from('galeri_album').select('id,photo_count,status,sampul_url',{count:'exact'}).eq('status','published').is('deleted_at',null).order('id').limit(100);
if(albums.error)throw new Error('Public album read failed: '+albums.error.code);
const seeded=albums.data.filter(row=>/^a11a0000-0000-4000-8000-00000000000[1-4]$/.test(row.id));assert.equal(seeded.length,4);assert.equal(seeded.reduce((sum,row)=>sum+row.photo_count,0),22);
const videos=await client.from('berita').select('id,youtube_id').limit(0);if(videos.error)throw new Error('News video column is unavailable: '+videos.error.code);
const require=createRequire(import.meta.url),runtime='C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const {chromium}=require(runtime),{expect}=require(runtime+'/test.js'),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:5173/#/galeri');await expect(page.locator('#album-grid .album-card')).toHaveCount(4);await expect(page.locator('#gallery-status')).toHaveText('');await expect(page.locator('#album-more')).toBeHidden();
 await page.locator('#album-grid').screenshot({path:'tmp/gallery-editor-video-browser/gallery-real-supabase.png'});
 await page.locator('.gallery-filter[data-filter="Akademik"]').click();await expect(page.locator('#album-grid .album-card')).toHaveCount(1);await page.locator('#album-grid .album-cover').click();await expect(page.locator('.album-viewer[open] .album-thumbnails button')).toHaveCount(3);
 await expect.poll(()=>page.locator('.album-viewer[open] .album-stage img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(1000);
 await page.locator('.album-viewer[open] [data-album-close]').click();assert.deepEqual(errors,[]);
 const result={publicRead:true,seededAlbums:4,seededPhotos:22,newsYoutubeColumn:true,realPublicPage:true,highResolutionViewer:true,applicantDataRead:false,productionTestWrites:false};
 await writeFile('tmp/gallery-editor-video-browser/public-live-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
