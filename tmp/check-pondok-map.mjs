import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {expect}=require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test.js');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});const requests=[],failures=[];
page.on('requestfailed',request=>{if(request.url().includes('google'))failures.push({host:new URL(request.url()).hostname,path:new URL(request.url()).pathname,error:request.failure()?.errorText});});
page.on('response',response=>{if(response.url().includes('google.')&&response.url().includes('/maps'))requests.push({host:new URL(response.url()).hostname,path:new URL(response.url()).pathname,status:response.status()});});
await page.goto('http://127.0.0.1:5173/#/kontak',{waitUntil:'networkidle'});const map=page.locator('iframe[title^="Lokasi"]');await map.waitFor();await map.scrollIntoViewIfNeeded();
await expect.poll(()=>page.frames().some(frame=>frame.url().includes('google')&&frame.url().includes('maps')),{timeout:20000}).toBe(true);
const frame=page.frames().find(frame=>frame.url().includes('google')&&frame.url().includes('maps'));
await frame.waitForLoadState('load',{timeout:20000});
await expect.poll(async()=>((await frame.locator('body').innerText()).length),{timeout:20000}).toBeGreaterThan(0).catch(()=>{});
const text=(await frame.locator('body').innerText()).slice(0,1200);
await map.screenshot({path:'tmp/pondok-info-browser/map-loaded.png'});
console.log(JSON.stringify({requests,failures,frameHost:new URL(frame.url()).hostname,text}));
}finally{await browser.close();}
