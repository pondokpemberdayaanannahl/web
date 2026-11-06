// Real PHP HTTP integration against local mocks of Google and Supabase.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHmac, createHash } from 'node:crypto';
import { mkdirSync,mkdtempSync,writeFileSync,readFileSync,readdirSync,realpathSync,rmSync } from 'node:fs';
import { resolve,sep } from 'node:path';
const workspace=resolve('.'), base=resolve('.backend-backups');mkdirSync(base,{recursive:true});
const folder=mkdtempSync(resolve(base,'forms-http-')), secret='a'.repeat(64), origin='http://127.0.0.1:5173';
let mode='ok', php, log='', requests=[], settingsDown=false, staffRole='admin', confirmDown=false;
const actor='00000000-0000-4000-8000-000000000001', adminToken='t'.repeat(60), setupRequests=[];
const settings={registration:{year:2027,recap_ready:true},opens_on:'2020-01-01',closes_on:'2099-12-31',revision:1,levels:[{title:'Jenjang Uji',description:'Data sintetis'}]};
const mock=createServer(async(req,res)=>{
  if(req.url==='/auth/v1/user') { res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({id:actor}));return; }
  if(req.url.startsWith('/rest/v1/pengurus?')) { res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify([{active:true,role:staffRole}]));return; }
  if(req.url==='/rest/v1/rpc/confirm_registration_sheet') {
    assert.equal(req.headers.authorization,'Bearer '+adminToken);
    let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);
    if(confirmDown){res.writeHead(503);res.end('{}');return;}
    assert.equal(input.p_year,settings.registration.year);settings.registration={...settings.registration,recap_ready:true,recap_sheet_id:input.p_sheet_id};settings.revision++;
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(settings));return;
  }
  if(req.url.startsWith('/rest/v1/pondok_settings?')){
    assert.equal(req.headers.apikey,'test-public-key-123456');
    res.writeHead(settingsDown ? 503 : 200,{'Content-Type':'application/json'});
    res.end(JSON.stringify(settingsDown ? {error:'unavailable'} : [settings])); return;
  }
  let raw='';for await(const chunk of req)raw+=chunk;const envelope=JSON.parse(raw);
  if(envelope.scope==='media') {
    assert.equal(envelope.signature,createHmac('sha256',secret).update('annahl.media.v1:'+envelope.data).digest('hex'));
    const setup=JSON.parse(envelope.data);setupRequests.push(setup);assert.equal(setup.actor,actor);
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,id:setup.id,action:setup.action,year:setup.year,sheetId:77}));return;
  }
  assert.equal(envelope.signature,createHmac('sha256',secret).update('annahl.forms.v1:'+envelope.data).digest('hex'));
  const record=JSON.parse(envelope.data);requests.push(record);
  if(mode==='redirect'){res.writeHead(302,{Location:'https://another.example/never-follow'});res.end();return;}
  if(mode==='html'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<h1>not a receipt</h1>');return;}
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,id:mode==='wrong'?'wrong-id':record.id,kind:record.kind}));
});
const listen=server=>new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
try {
  await listen(mock);const mockPort=mock.address().port;
  const probe=createServer();await listen(probe);const phpPort=probe.address().port;await new Promise(ok=>probe.close(ok));
  const config={apps_script_url:`http://127.0.0.1:${mockPort}/exec`,shared_secret:secret,allowed_origins:[origin],
    supabase_url:`http://127.0.0.1:${mockPort}`,supabase_anon_key:'test-public-key-123456',rate_limit_directory:resolve(folder,'rates')};
  const configFile=resolve(folder,'config.php'),legacyConfig={...config};delete legacyConfig.supabase_url;delete legacyConfig.supabase_anon_key;
  writeFileSync(configFile,`<?php return json_decode(base64_decode('${Buffer.from(JSON.stringify(legacyConfig)).toString('base64')}'),true);`);
  writeFileSync(resolve(folder,'media-config.php'),`<?php return json_decode(base64_decode('${Buffer.from(JSON.stringify(config)).toString('base64')}'),true);`);
  php=spawn(process.env.PHP_BINARY||'php',['-S',`127.0.0.1:${phpPort}`,'-t',resolve('public')],{cwd:workspace,env:{...process.env,ANNAHL_FORMS_CONFIG:configFile,ANNAHL_FORMS_TEST_MODE:'1'},stdio:['ignore','ignore','pipe'],windowsHide:true});
  php.stderr.on('data',data=>{log+=data.toString();});
  const endpoint=`http://127.0.0.1:${phpPort}/api/forms.php`,headers={'X-Annahl-Form':'1',Origin:origin};
  let ready=false;for(let attempt=0;attempt<50;attempt++){try{await fetch(endpoint);ready=true;break;}catch{await new Promise(ok=>setTimeout(ok,100));}}
  assert.ok(ready,log);
  let response=await fetch(endpoint,{headers});assert.equal(response.status,200);const {token}=await response.json();assert.ok(token);
  response=await fetch(endpoint,{headers:{'X-Annahl-Form':'1'}});assert.equal(response.status,200,'Same-origin-capable clients without Fetch Metadata may mint a session');
  response=await fetch(endpoint,{headers:{'X-Annahl-Form':'1','Sec-Fetch-Site':'cross-site'}});assert.equal(response.status,403);
  const id='11111111-2222-4333-8444-555555555555', bytes=Buffer.from('%PDF-1.4\nUJI LOKAL'), payload={nama:'UJI LOKAL',jumlah:'12345',metode:'QRIS',program:'Donasi Umum',pesan:'Bukan pembayaran'};
  const input={id,kind:'donasi',payload,token,website:'',files:[{name:'uji.pdf',data:bytes.toString('base64')}]};
  const post=(body=input,extras={})=>fetch(endpoint,{method:'POST',headers:{...headers,'Content-Type':'application/json',...extras},body:JSON.stringify(body)});
  response=await post();assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,id,kind:'donasi'});
  assert.equal(requests[0].files[0].sha256,createHash('sha256').update(bytes).digest('hex'));
  assert.equal(requests[0].files[0].mime,'application/pdf');
  await post();assert.equal(requests[1].id,id);
  response=await post(input,{Origin:'https://other.example'});assert.equal(response.status,403);
  response=await post({...input,token:'invalid'});assert.equal(response.status,403);
  response=await post({...input,website:'spam'});assert.equal(response.status,422);
  response=await post({...input,files:[{name:'bad.exe',data:bytes.toString('base64')}]});assert.equal(response.status,422);
  assert.equal(requests.length,2,'Rejected submissions must not reach Google');
  const registration={...input,kind:'pendaftaran',payload:{nama:'UJI LOKAL',tempatLahir:'Bogor',tanggalLahir:'2014-04-10',registrationYear:'2027',jenisKelamin:'Laki-laki',asalSekolah:'Sekolah Uji',jenjang:'Jenjang Uji',namaWali:'Wali Uji',noWA:'00000000000',email:'',alamat:'Alamat Uji'}};
  response=await fetch(endpoint+'?kind=pendaftaran',{headers});assert.equal(response.status,200);
  assert.equal((await response.json()).registration.state,'open');
  response=await post({...registration,payload:{...registration.payload,jenjang:'Jenjang palsu'}});assert.equal(response.status,422);
  const large=Buffer.alloc(8*1024*1024, 'x');large.write('%PDF-1.4');
  response=await post({...registration,files:[{name:'besar.pdf',data:large.toString('base64')}]});assert.equal(response.status,200);
  assert.equal(requests.at(-1).payload.jenjang,'Jenjang Uji');assert.equal(requests.at(-1).files[0].bytes,large.length);
  settings.closes_on='2020-01-01';
  response=await fetch(endpoint+'?kind=pendaftaran',{headers});assert.equal((await response.json()).registration.state,'closed');
  response=await post(registration);assert.equal(response.status,409);
  settingsDown=true;
  response=await post(registration);assert.equal(response.status,503);
  assert.equal(requests.length,3,'Closed dates and missing settings must never forward to Google, even with a fresh token');
  for(const state of ['wrong','html','redirect']){mode=state;response=await post();assert.equal(response.status,502);assert.equal((await response.json()).ok,false);}
  mode='ok';settingsDown=false;settings.closes_on='2099-12-31';settings.registration.recap_ready=false;
  const setupEndpoint=endpoint.replace('/forms.php','/registration.php');
  const setupHeaders={'X-Annahl-Registration':'1',Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+adminToken};
  const setup=(year=2027,headers=setupHeaders)=>fetch(setupEndpoint,{method:'POST',headers,body:JSON.stringify({year})});
  response=await setup(2027,{...setupHeaders,Origin:'https://other.example'});assert.equal(response.status,403);
  response=await setup(2027,{...setupHeaders,Authorization:''});assert.equal(response.status,401);
  staffRole='editor';response=await setup();assert.equal(response.status,403);staffRole='admin';
  response=await setup(2028);assert.equal(response.status,409);
  assert.equal(setupRequests.length,0,'Unauthorized and stale-year requests never create tabs');
  confirmDown=true;response=await setup();assert.equal(response.status,502);assert.equal(settings.registration.recap_ready,false);
  confirmDown=false;response=await setup();assert.equal(response.status,200);assert.equal((await response.json()).settings.registration.recap_sheet_id,77);
  assert.equal(setupRequests.length,2);
  for(const file of readdirSync(resolve(folder,'rates'))){const contents=readFileSync(resolve(folder,'rates',file),'utf8');assert.ok(!contents.includes(id)&&!contents.includes('UJI LOKAL')&&!contents.includes('uji.pdf'));}
  console.log('PASS: real PHP HTTP -> signed Google mock; exact receipts; retry ID; CSRF/origin/honeypot; file sniffing; redirect isolation; no stored form bodies.');
} finally {
  if(php){php.kill();await new Promise(ok=>{if(php.exitCode!==null)ok();else php.once('exit',ok);});}
  await new Promise(ok=>mock.close(ok));
  const actual=realpathSync(folder), allowed=realpathSync(base);
  assert.ok(actual.startsWith(allowed+sep)&&actual.split(sep).at(-1).startsWith('forms-http-'),'Cleanup must stay inside owned workspace test folder');
  rmSync(actual,{recursive:true,force:true});
}
