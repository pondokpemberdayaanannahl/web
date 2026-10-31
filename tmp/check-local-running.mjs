import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
await mkdir('tmp/local-running',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const response=await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await page.locator('#stories .section-title').waitFor();assert.equal(response.status(),200);
 await page.screenshot({path:'tmp/local-running/home.png'});
 const stories={count:await page.locator('#home-stories-grid .story-card').count(),status:await page.locator('#home-stories-status').innerText()};
 const registration=await page.goto('http://127.0.0.1:5173/#/pendaftaran',{waitUntil:'networkidle'});
 await page.locator('.registration-bank').waitFor();
 assert.ok((await page.locator('.registration-bank').innerText()).includes('0000 0000 0000'));
 await page.goto('http://127.0.0.1:5173/login.html',{waitUntil:'networkidle'});
 await page.locator('#username').fill('admin');await page.locator('#password').fill('123');await page.locator('#login-btn').click();
 await page.waitForURL('**/admin.html');await page.locator('#demo-notice').waitFor();
 assert.equal(await page.locator('#overview-title').innerText(),'Selamat datang, admin.');
 assert.equal(errors.length,0,errors.join('\n'));
 await page.screenshot({path:'tmp/local-running/admin.png'});
 const api=await fetch('http://127.0.0.1:5173/api/forms.php');await api.body.cancel();
 console.log(JSON.stringify({website:response.status(),registration:registration?.status()||200,stories,dummyLogin:true,pageErrors:errors,formsApiStatus:api.status}));
}finally{await browser.close();}
