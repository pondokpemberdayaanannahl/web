import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,createHmac,randomUUID} from 'node:crypto';
import vm from 'node:vm';
const source=readFileSync(new URL('../integrations/google-sheets/Code.gs',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../integrations/google-sheets/Media.gs',import.meta.url),'utf8');
function fixture(){
 const owner='pondokpemberdayaanannahl@gmail.com',secret='a'.repeat(64),files=new Map();let serial=0;
 const properties={ANNAHL_SPREADSHEET_ID:'1GJJDb0AEv4a3yugzQpv2hMhU1ke9g_zIbsNGQMNlmg8',ANNAHL_SHEETS_SECRET:secret};
 const permissions=[{type:'user',role:'owner',emailAddress:owner}];
 const context={console,Date,ContentService:{MimeType:{JSON:'json'},createTextOutput:value=>({value,setMimeType(){return this;}})},PropertiesService:{getScriptProperties:()=>({getProperties:()=>properties,getProperty:key=>properties[key],setProperty:(key,value)=>{properties[key]=value;}})},
 Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,value)=>[...createHash('sha256').update(typeof value==='string'?value:Buffer.from(value)).digest()],computeHmacSha256Signature:(data,key)=>[...createHmac('sha256',key).update(data).digest()],base64Decode:text=>[...Buffer.from(text,'base64')],base64Encode:bytes=>Buffer.from(bytes).toString('base64'),newBlob:(bytes,mime,name)=>({bytes,mime,name})},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},ScriptApp:{getOAuthToken:()=> 'fixture-google-token'},UrlFetchApp:{fetch(url,options){assert.match(url,/^https:\/\/www.googleapis.com\/drive\/v3\/files\/[^?]+\?alt=media$/);assert.equal(options.headers.Authorization,'Bearer fixture-google-token');const id=url.match(/files\/([^?]+)/)[1],bytes=files.get(id).blob.bytes;return{getResponseCode:()=>200,getContent:()=>bytes};}},
 Drive:{Files:{get:id=>{if(!files.has(id))throw Error('Missing file');return structuredClone(files.get(id));},create(metadata,blob){const file={...structuredClone(metadata),id:'fixture-'+String(++serial).padStart(25,'0'),ownedByMe:true,owners:[{emailAddress:owner}],permissions:structuredClone(permissions),createdTime:new Date().toISOString(),...(blob?{blob,size:String(blob.bytes.length)}:{})};files.set(file.id,file);return{id:file.id};},update(metadata,id){Object.assign(files.get(id),structuredClone(metadata));return files.get(id);},list(options){assert.ok(Object.values(options).every(value=>value!==undefined),'Google API query must not contain undefined optional values');const {q}=options;if(q.includes('fullText'))assert.equal(options.orderBy,undefined,'Google fullText search uses relevance order');let result=[...files.values()];const parent=q.match(/^'([^']+)' in parents/);if(parent)result=result.filter(file=>file.parents?.includes(parent[1]));for(const match of q.matchAll(/key='([^']+)' and value='([^']+)'/g))result=result.filter(file=>file.appProperties?.[match[1]]===match[2]);return{files:result};}},Permissions:{list:id=>({permissions:files.get(id).permissions})}}};
 vm.runInNewContext(source,context);
 function call(action,body={},mutate){const record={version:1,id:randomUUID(),issuedAt:Math.floor(Date.now()/1000),actor:'fixture-admin',action,...body},data=JSON.stringify(record),envelope={scope:'media',data,signature:createHmac('sha256',secret).update('annahl.media.v1:'+data).digest('hex')};mutate?.(envelope);return JSON.parse(context.doPost({postData:{contents:JSON.stringify(envelope)}}).value);}
 return{call,files,properties,context};
}
const assetId='11111111-2222-4333-8444-555555555555';
function part(variant,text='image-fixture'){const bytes=Buffer.from(text);return{assetId,variant,name:'foto.png',folder:'Dokumentasi',file:{name:'foto.png',mime:'image/png',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),data:bytes.toString('base64')}};}
test('media signature and freshness are checked before accessing owner storage',()=>{
 const app=fixture();assert.equal(app.call('setup',{},envelope=>{envelope.signature='b'.repeat(64);}).code,'denied');assert.equal(app.call('setup',{issuedAt:1}).code,'invalid');assert.equal(app.files.size,0);
});
test('photo uploads are retry-safe and enter the picker only after all three parts exist',()=>{
 const app=fixture();assert.equal(app.call('setup').ok,true);
 for(const variant of ['original','full'])assert.equal(app.call('upload',part(variant)).ok,true);
 assert.equal(app.call('list').photos.length,0);
 assert.equal(app.call('upload',part('thumbnail')).asset.complete,true);
 const count=app.files.size;assert.equal(app.call('upload',part('thumbnail')).ok,true);assert.equal(app.files.size,count);
 assert.equal(app.call('list').photos.length,1);assert.equal(app.call('list',{search:'Dokumentasi'}).ok,true);assert.equal(app.call('upload',part('full','different')).code,'conflict');
 for(const file of app.files.values())assert.deepEqual(file.permissions,[{type:'user',role:'owner',emailAddress:'pondokpemberdayaanannahl@gmail.com'}]);
});
test('public image operation cannot read originals, arbitrary Drive files, or form attachments',()=>{
 const app=fixture();app.call('setup');for(const variant of ['original','full','thumbnail'])app.call('upload',part(variant));
 assert.equal(app.call('image',{assetId,variant:'original'}).code,'invalid');
 assert.equal(app.call('image',{assetId:'99999999-2222-4333-8444-555555555555',variant:'full'}).code,'missing');
 const image=app.call('image',{assetId,variant:'thumbnail'});assert.equal(image.ok,true);assert.equal(Buffer.from(image.data,'base64').toString(),'image-fixture');
});
test('a forms folder cannot be used as the website media library',()=>{
 const app=fixture();app.call('setup');
 app.properties.ANNAHL_UPLOADS_FOLDER_ID=app.properties.ANNAHL_MEDIA_FOLDER_ID;
 assert.equal(app.call('status').code,'media_not_ready');
});
