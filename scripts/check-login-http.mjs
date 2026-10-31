import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';

const parent=resolve('tmp/login-http'); await mkdir(parent,{recursive:true});
const folder=await mkdtemp(join(parent,'fixture-'));
const configPath=join(folder,'login-config.php');
const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));
const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
const origin=`http://127.0.0.1:${port}`;
const quote=value=>"'"+value.replaceAll('\\','\\\\').replaceAll("'","\\'")+"'";
await writeFile(configPath,`<?php return [
 'supabase_url'=>'https://abcdefghijklmnopqrst.supabase.co', 'supabase_anon_key'=>'sb_publishable_fixture',
 'shared_secret'=>'${'a'.repeat(64)}', 'allowed_origins'=>[${quote(origin)}],
 'rate_limit_directory'=>__DIR__.'/rates', 'usernames'=>['admin'=>'private@example.org']
];`);
const php=spawn('php',['-S',`127.0.0.1:${port}`,'-t','public'],{env:{...process.env,ANNAHL_LOGIN_CONFIG:configPath},stdio:['ignore','ignore','pipe'],windowsHide:true});
let diagnostics='';php.stderr.on('data',chunk=>{diagnostics=(diagnostics+chunk).slice(-2000);});
let launchError;php.on('error',error=>{launchError=error;});
const headers={'Content-Type':'application/json','X-Annahl-Login':'1',Origin:origin};
const request=(body='{}',custom=headers,method='POST')=>fetch(origin+'/api/login.php',{method,headers:custom,...(method==='POST'?{body}:{})});
try {
 let ready=false;
 for(let i=0;i<80;i++){
  if(launchError)throw launchError;
  if(php.exitCode!==null)throw Error('PHP test server stopped before readiness: '+diagnostics);
  try{const response=await fetch(origin+'/api/login.php');await response.text();ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}
 }
 assert.ok(ready,'PHP test server did not start');
 const get=await request('',{},'GET');assert.equal(get.status,405);assert.equal(get.headers.get('cache-control'),'no-store, private');
 assert.equal((await request('{}',{'Content-Type':'application/json',Origin:origin})).status,403);
 assert.equal((await request('{}',{...headers,'Content-Type':'text/plain'})).status,415);
 assert.equal((await request('{}',{...headers,Origin:'https://other.example'})).status,403);
 assert.equal((await request('x'.repeat(8193))).status,413);
 const malformed=await request('{');assert.equal(malformed.status,401);assert.doesNotMatch(await malformed.text(),/private@example|access_token|refresh_token/);
 assert.equal((await fetch(origin+'/api/login-core.php')).status,404);
 for(let i=0;i<59;i++)assert.equal((await request('{}')).status,401);
 assert.equal((await request('{}')).status,429);
 for(const file of await readdir(join(folder,'rates'))){
  const contents=await readFile(join(folder,'rates',file),'utf8');assert.doesNotMatch(contents,/username|password|private@example|127\.0\.0\.1/);
 }
 console.log('PASS: PHP HTTP method, content type, origin, body limit, private core, generic errors and IP rate limiting; no upstream Auth contacted.');
} finally {
 const stopped=new Promise(resolve=>php.once('exit',resolve));
 if(php.exitCode===null&&!launchError){php.kill();await stopped;}
 const child=relative(parent,folder);assert.ok(child&&!child.startsWith('..')&&!isAbsolute(child));await rm(folder,{recursive:true,force:true});
}
