import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pondokContact,programPesantren,programUnggulan,ekstrakurikuler} from '../src/data/pondok.js';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {expect}=require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test.js');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const output='tmp/pondok-info-browser';await mkdir(output,{recursive:true});const results=[];
async function noOverflow(page,label){
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 if(overflow)console.log(JSON.stringify({label,viewport:page.viewportSize(),elements:await page.evaluate(()=>[...document.querySelectorAll('#page-content *')].filter(node=>node.getBoundingClientRect().right>innerWidth+1).map(node=>({tag:node.tagName,id:node.id,cls:node.className,right:node.getBoundingClientRect().right})).slice(0,12))}));
 assert.equal(overflow,false,label);
}
try{
 for(const width of process.env.QA_WIDTHS?process.env.QA_WIDTHS.split(',').map(Number):[1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/#/',{waitUntil:'networkidle'});
  await expect(page.locator('#programs .card-title')).toHaveText(programPesantren.map(row=>row.title));
  await expect(page.locator('#featured-programs .card-title')).toHaveText(programUnggulan.map(row=>row.title));
  await expect(page.locator('.wa-float')).toHaveAttribute('href',new RegExp('wa.me/'+pondokContact.whatsapp));
  await noOverflow(page,'home');await page.locator('#programs').scrollIntoViewIfNeeded();await page.locator('#programs').screenshot({path:`${output}/home-programs-${width}.png`});
  await page.goto('http://127.0.0.1:5173/#/program',{waitUntil:'networkidle'});
  await expect(page.locator('#program-pesantren .card-title')).toHaveText(programPesantren.map(row=>row.title));
  await expect(page.locator('#program-unggulan .card-title')).toHaveText(programUnggulan.map(row=>row.title));
  await expect(page.locator('#ekstrakurikuler .card-title')).toHaveText(ekstrakurikuler.map(row=>row.title));
  await noOverflow(page,'program');await page.locator('#ekstrakurikuler').scrollIntoViewIfNeeded();await page.locator('#ekstrakurikuler').screenshot({path:`${output}/extracurricular-${width}.png`});
  await page.goto('http://127.0.0.1:5173/#/pendaftaran',{waitUntil:'networkidle'});
  await expect(page.locator('#reg-program option')).toHaveText(['Pilih program',...programPesantren.map(row=>row.title)]);
  await noOverflow(page,'registration');
  const mapResponsePromise=page.waitForResponse(response=>response.url().startsWith('https://www.google.com/maps?q='),{timeout:20000}).catch(()=>null);
  await page.goto('http://127.0.0.1:5173/#/kontak',{waitUntil:'networkidle'});
  await expect(page.locator('#page-content')).toContainText(pondokContact.address);await expect(page.locator('.contact-phone')).toHaveText(pondokContact.phone);
  await expect(page.locator('.contact-phone')).toHaveAttribute('href','tel:'+pondokContact.telephone);
  await expect(page.locator('.footer')).toContainText(pondokContact.address);await expect(page.locator('.footer')).toContainText(pondokContact.phone);
  const map=page.locator('iframe[title^="Lokasi"]');assert.equal(new URL(await map.getAttribute('src')).searchParams.get('q'),pondokContact.address);
  await map.scrollIntoViewIfNeeded();const mapResponse=await mapResponsePromise;
  await page.locator('#page-content').screenshot({path:`${output}/contact-${width}.png`});
  await noOverflow(page,'contact');assert.equal(errors.length,0,errors.join('\n'));
  results.push({width,mainPrograms:4,featuredPrograms:4,extracurricular:14,registrationChoices:4,contactAndWhatsApp:true,mapHttpStatus:mapResponse?.status()??null,noOverflow:true,pageErrors:errors});
  await context.close();
 }
 await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
