import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createServer } from '../node_modules/vite/dist/node/index.js';
const require=createRequire(import.meta.url);
const { chromium }=require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let dummyPassword='123';
for(const file of ['.env','.env.local']){
 try{const contents=await readFile(file,'utf8');const match=contents.match(/^VITE_DUMMY_PASSWORD=(.*)$/m);if(match)dummyPassword=match[1].trim().replace(/^(['"])(.*)\1$/,'$2');}catch{}
}
await mkdir('tmp/username-browser',{recursive:true});
process.env.VITE_DUMMY_LOGIN_ENABLED='true';process.env.VITE_DUMMY_USERNAME='admin';process.env.VITE_DUMMY_PASSWORD=dummyPassword;
const vite=await createServer({configFile:'vite.config.js',logLevel:'silent',server:{host:'127.0.0.1',port:0,open:false}});await vite.listen();
const origin=`http://127.0.0.1:${vite.httpServer.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const results=[];
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/login.php',route=>route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({ok:false,message:'PRIVATE_DIAGNOSTIC_MUST_NOT_RENDER'})}));
  await page.goto(origin+'/login.html',{waitUntil:'networkidle'});
  await page.getByLabel('Username',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`tmp/username-browser/login-${width}.png`,fullPage:true});
  await page.locator('#username').fill('admin.pondok');await page.locator('#password').fill('wrong-password');await page.locator('#login-btn').click();
  await page.locator('#login-error').filter({hasText:'Username atau password'}).waitFor();
  assert.ok(!(await page.locator('#login-error').innerText()).includes('PRIVATE_DIAGNOSTIC'));
  await page.locator('#username').fill('admin');await page.locator('#password').fill('wrong-dummy');await page.locator('#login-btn').click();
  await page.locator('#login-error').filter({hasText:'belum sesuai'}).waitFor();
  await page.locator('#password-toggle').click();assert.equal(await page.locator('#password').getAttribute('type'),'text');
  await page.locator('#password-toggle').click();assert.equal(await page.locator('#password').getAttribute('type'),'password');
  await page.locator('#password').fill(dummyPassword);await page.locator('#login-btn').click();
  await page.waitForURL('**/admin.html');await page.getByText('Selamat datang, admin.',{exact:true}).waitFor();
  await page.screenshot({path:`tmp/username-browser/dashboard-${width}.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('annahl-dummy-user')),'admin');
  await page.locator('#logout-btn').click();await page.waitForURL('**/login.html');
  assert.equal(errors.length,0,errors.join('\n'));
  results.push({width,dummyUsername:'admin',wrongUsernameRejected:true,passwordToggle:true,demoLogin:true,logout:true,noHorizontalOverflow:true,pageErrors:errors});
  await context.close();
 }
 await writeFile('tmp/username-browser/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();await vite.close();}
