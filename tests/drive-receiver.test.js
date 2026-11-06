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
 Drive:{Files:{
   get(id) {
     if (!files.has(id)) throw Error('Missing file');
     return structuredClone(files.get(id));
   },
   create(metadata,blob) {
     const file = {
       ...structuredClone(metadata),id:'fixture-'+String(++serial).padStart(25,'0'),
       ownedByMe:true,owners:[{emailAddress:owner}],permissions:structuredClone(permissions),
       createdTime:new Date().toISOString(),
       ...(blob ? {blob,size:String(blob.bytes.length)} : {})
     };
     files.set(file.id,file);
     return {id:file.id};
   },
   update(metadata,id,blob,options = {}) {
     const file = files.get(id);
     Object.assign(file,structuredClone(metadata));
     if (blob) { file.blob = blob; file.size = String(blob.bytes.length); }
     if (options.removeParents) file.parents = file.parents.filter(parent => !options.removeParents.split(',').includes(parent));
     if (options.addParents) file.parents = [...new Set([...file.parents,...options.addParents.split(',')])];
     return structuredClone(file);
   },
   list(options) {
     assert.ok(Object.values(options).every(value=>value!==undefined),'Google API query must not contain undefined optional values');
     const {q}=options;
     if(q.includes('fullText'))assert.equal(options.orderBy,undefined,'Google fullText search uses relevance order');
     let result=[...files.values()].filter(file => !file.trashed);
     const parent=q.match(/^'([^']+)' in parents/);
     if(parent)result=result.filter(file=>file.parents?.includes(parent[1]));
     for(const match of q.matchAll(/key='([^']+)' and value='([^']+)'/g))result=result.filter(file=>file.appProperties?.[match[1]]===match[2]);
     return {files:result.map(file => structuredClone(file))};
   }
 },Permissions:{list:id=>({permissions:files.get(id).permissions})}}};
 vm.runInNewContext(source,context);
 function call(action,body={},mutate){const record={version:1,id:randomUUID(),issuedAt:Math.floor(Date.now()/1000),actor:'fixture-admin',action,...body},data=JSON.stringify(record),envelope={scope:'media',data,signature:createHmac('sha256',secret).update('annahl.media.v1:'+data).digest('hex')};mutate?.(envelope);return JSON.parse(context.doPost({postData:{contents:JSON.stringify(envelope)}}).value);}
 return{call,files,properties,context};
}
const assetId='11111111-2222-4333-8444-555555555555';
function part(variant,text='image-fixture'){const bytes=Buffer.from(text);return{assetId,variant,name:'foto.png',folder:'Dokumentasi',file:{name:'foto.png',mime:'image/png',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),data:bytes.toString('base64')}};}
test('media signature and freshness are checked before accessing owner storage',()=>{
 const app=fixture();assert.equal(app.call('setup',{},envelope=>{envelope.signature='b'.repeat(64);}).code,'denied');assert.equal(app.call('setup',{issuedAt:1}).code,'invalid');assert.equal(app.files.size,0);
});
test('a photo is a single file at the library root and thumbnail retries add no Drive files',()=>{
 const app=fixture();assert.equal(app.call('setup').ok,true);
 assert.equal(app.call('upload',part('full')).asset.complete,true);
 assert.equal(app.call('list').photos.length,1);
 assert.equal(app.call('upload',part('thumbnail')).asset.complete,true);
 const count=app.files.size;assert.equal(app.call('upload',part('thumbnail')).ok,true);assert.equal(app.files.size,count);
 assert.equal(count,2);
 const photo=[...app.files.values()].find(file => file.appProperties.layout === 'single-file');
 assert.deepEqual(photo.parents,[app.properties.ANNAHL_MEDIA_FOLDER_ID]);
 assert.equal(photo.mimeType,'image/png');
 assert.equal(photo.name,'foto.png');
 assert.equal(app.call('list').photos.length,1);assert.equal(app.call('list',{search:'Dokumentasi'}).ok,true);assert.equal(app.call('upload',part('full','different')).code,'conflict');
 for(const file of app.files.values())assert.deepEqual(file.permissions,[{type:'user',role:'owner',emailAddress:'pondokpemberdayaanannahl@gmail.com'}]);
});

test('older upload clients finish in one file and cannot replace a completed photo on retry',()=>{
  const app=fixture();app.call('setup');
  assert.equal(app.call('upload',part('original','source')).asset.complete,false);
  assert.equal(app.call('list').photos.length,0);
  assert.equal(app.call('upload',part('full','HD')).asset.complete,true);
  assert.equal(app.call('upload',part('original','source')).asset.complete,true);
  assert.equal(app.call('upload',part('thumbnail','small')).ok,true);
  assert.equal(app.files.size,2);
  assert.equal(app.call('upload',part('original','changed')).code,'conflict');
  assert.equal(Buffer.from(app.call('image',{assetId,variant:'full'}).data,'base64').toString(),'HD');
});

test('the same source photo reuses its canonical HD file after the browser changes encoding',()=>{
  const app=fixture();app.call('setup');
  const sourceSha256=createHash('sha256').update('original source').digest('hex');
  assert.equal(app.call('upload',{...part('full','first encoding'),sourceSha256}).ok,true);
  const reply=app.call('upload',{...part('full','second encoding'),sourceSha256});
  assert.equal(reply.reused,true);
  assert.equal(reply.sourceSha256,sourceSha256);
  assert.equal(app.files.size,2);
  assert.equal(Buffer.from(app.call('image',{assetId,variant:'full'}).data,'base64').toString(),'first encoding');
  assert.equal(app.call('upload',{...part('full','third encoding'),sourceSha256:'0'.repeat(64)}).code,'conflict');
});

function legacyPhoto(app) {
  const drive = app.context.Drive.Files, root = app.properties.ANNAHL_MEDIA_FOLDER_ID;
  const folder = drive.create({name:'kegiatan.heic',description:'Kegiatan',parents:[root],mimeType:'application/vnd.google-apps.folder',appProperties:{assetId,state:'ready'}});
  const properties = {assetId,state:'ready'};
  for (const [variant,content] of [['original','original-bytes'],['full','HD-bytes'],['thumbnail','small-bytes']]) {
    const bytes = [...Buffer.from(content)], sha256 = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    const file=drive.create({name:variant+' - foto.jpg',parents:[folder.id],mimeType:'image/jpeg',appProperties:{variant,sha256}},{bytes});
    properties[variant+'Id'] = file.id;
  }
  drive.update({appProperties:properties},folder.id);
  return folder.id;
}

test('legacy migration preserves asset IDs, HD bytes, original backups and public image access',()=>{
  const app=fixture();app.call('setup');
  const folder=legacyPhoto(app);
  const before=app.call('image',{assetId,variant:'full'}).data;
  const total=app.files.size;
  const result=app.context.migrateWebsiteMediaToSingleFiles();
  assert.equal(result.migrated,1);
  const rootFiles=[...app.files.values()].filter(file=>file.parents?.includes(app.properties.ANNAHL_MEDIA_FOLDER_ID));
  assert.equal(rootFiles.length,1);
  assert.equal(rootFiles[0].name,'kegiatan.jpg');
  assert.equal(rootFiles[0].appProperties.assetId,assetId);
  assert.deepEqual(app.files.get(folder).parents,[app.properties.ANNAHL_MEDIA_ARCHIVE_FOLDER_ID]);
  assert.equal(app.files.size,total+1,'Only a private archive folder is created; photo bytes are moved, never copied');
  assert.equal(app.call('image',{assetId,variant:'full'}).data,before);
  assert.equal(app.call('list').photos.length,1);
  assert.equal(app.context.migrateWebsiteMediaToSingleFiles().migrated,0);
});

test('native file selection resolves known library images while excluding arbitrary and form files',()=>{
  const app=fixture();app.call('setup');const folder=legacyPhoto(app);
  const fullId=app.files.get(folder).appProperties.fullId;
  assert.equal(app.call('resolve',{fileId:fullId}).asset.id,assetId);
  assert.equal(app.call('resolve',{fileId:'private-form-attachment-123'}).asset,null);
  app.context.migrateWebsiteMediaToSingleFiles();
  assert.equal(app.call('resolve',{fileId:fullId}).asset.id,assetId);
  assert.equal(app.call('resolve',{fileId:'../arbitrary'}).code,'invalid');
});

test('an interrupted archive move keeps the migrated image readable and a rerun finishes the same migration',()=>{
  const app=fixture();app.call('setup');const folder=legacyPhoto(app);
  const drive=app.context.Drive.Files,update=drive.update;
  let failOnce=true;
  drive.update=(metadata,id,blob,options={})=>{
    if (id===folder && options.addParents && failOnce) { failOnce=false; throw Error('Interrupted archive move'); }
    return update(metadata,id,blob,options);
  };
  assert.throws(()=>app.context.migrateWebsiteMediaToSingleFiles(),/Interrupted/);
  assert.equal(app.call('image',{assetId,variant:'full'}).ok,true);
  assert.equal(app.call('list').photos.length,1);
  const total=app.files.size;
  assert.equal(app.context.migrateWebsiteMediaToSingleFiles().migrated,1);
  assert.equal(app.files.size,total);
  assert.equal(app.call('list').photos.length,1);
});

test('an image request started before migration still reads the same file after its parent changes',()=>{
  const app=fixture();app.call('setup');const folder=legacyPhoto(app);
  const drive=app.context.Drive.Files,get=drive.get;
  const fullId=app.files.get(folder).appProperties.fullId;
  let migrateDuringRead=true;
  drive.get=(id,options)=>{
    if (id===fullId && migrateDuringRead) {
      migrateDuringRead=false;
      app.context.migrateWebsiteMediaToSingleFiles();
    }
    return get(id,options);
  };
  const image=app.call('image',{assetId,variant:'full'});
  assert.equal(image.ok,true);
  assert.equal(Buffer.from(image.data,'base64').toString(),'HD-bytes');
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
