import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash, createHmac } from 'node:crypto';

const source = fs.readFileSync(new URL('../integrations/google-sheets/Code.gs',import.meta.url),'utf8');
const owner = 'pondokpemberdayaanannahl@gmail.com', sheetId = '1GJJDb0AEv4a3yugzQpv2hMhU1ke9g_zIbsNGQMNlmg8';
const id = '11111111-2222-4333-8444-555555555555';
function record(files = []) { return {id,version:1,issuedAt:Math.floor(Date.now()/1000),kind:'donasi',payload:{nama:'=Tidak dieksekusi',jumlah:'12345',metode:'QRIS',program:'Donasi Umum',pesan:'DATA UJI'},files:files.map((text,index) => { const bytes=Buffer.from(text); return {name:`uji-${index}.pdf`,mime:'application/pdf',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),data:bytes.toString('base64')}; })}; }

function fixture() {
  const files = new Map(), properties = {ANNAHL_SPREADSHEET_ID:sheetId,ANNAHL_SHEETS_SECRET:'a'.repeat(64),ANNAHL_UPLOADS_FOLDER_ID:'root-12345678901234567890123'};
  const sheets = {}; let serial=0, failUpload=-1, failSheet=false, locked=false, releases=0;
  const ownerPermissions=[{type:'user',role:'owner',emailAddress:owner}];
  files.set(properties.ANNAHL_UPLOADS_FOLDER_ID,{id:properties.ANNAHL_UPLOADS_FOLDER_ID,mimeType:'application/vnd.google-apps.folder',parents:[],appProperties:{},ownedByMe:true,owners:[{emailAddress:owner}],permissions:ownerPermissions});
  function sheet(headers) {
    const rows=[headers];
    return {rows,getLastRow:()=>rows.length,getMaxRows:()=>1000,
      getRange(row,column,height=1,width=1) { return {getValues:()=>Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>rows[row-1+r]?.[column-1+c]??'')),getValue:()=>rows[row-1]?.[column-1],
        setValues(values) { if(failSheet) throw new Error('Simulated write failure'); values.forEach((valuesRow,r)=>{rows[row-1+r] ||= []; valuesRow.forEach((value,c)=>{rows[row-1+r][column-1+c]=value;});}); return this; },setNumberFormat(){return this;}}; }};
  }
  const context = {
    Date,Map,console:{info(){}},PropertiesService:{getScriptProperties:()=>({getProperties:()=>({...properties}),setProperty:(key,value)=>{properties[key]=value;}})},
    SpreadsheetApp:{openById:actual=>{assert.equal(actual,sheetId);return {getSheetByName:name=>sheets[name]};},flush(){}},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:value=>({value,setMimeType(){return this;}})},
    LockService:{getScriptLock:()=>({tryLock:()=>!locked,releaseLock(){releases++;}})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(algorithm,value)=>[...createHash('sha256').update(typeof value==='string'?Buffer.from(value):Buffer.from(value)).digest()],
      computeHmacSha256Signature:(data,key)=>[...createHmac('sha256',key).update(data).digest()],base64Decode:data=>[...Buffer.from(data,'base64')],newBlob:(bytes,mime,name)=>({bytes,mime,name})},
    Drive:{Files:{get:fileId=>{assert.ok(files.has(fileId));return files.get(fileId);},
      create(metadata,blob) { if(metadata.appProperties?.fileIndex===String(failUpload)) throw new Error('Simulated upload failure'); const fileId=`file-${String(++serial).padStart(25,'0')}`;
        const item={...metadata,id:fileId,ownedByMe:true,owners:[{emailAddress:owner}],permissions:ownerPermissions,blob}; files.set(fileId,item);return item;},
      list({q}) { const parent=q.match(/^'([^']+)' in parents/)[1], request=q.match(/value='([^']+)'/); return {files:[...files.values()].filter(file=>file.parents?.includes(parent)&&(!request||file.appProperties.requestId===request[1]))}; }},
      Permissions:{list:fileId=>({permissions:files.get(fileId).permissions})}},
  };
  vm.runInNewContext(source,context);
  const schemas=vm.runInNewContext('ANNAHL_FORMS',context);
  for(const schema of Object.values(schemas)) sheets[schema.name]=sheet([...schema.headers,'Lampiran (Drive)','Hash Kiriman','Folder Berkas']);
  const call=(data,mutate)=>{ const text=JSON.stringify(data), envelope={data:text,signature:createHmac('sha256',properties.ANNAHL_SHEETS_SECRET).update('annahl.forms.v1:'+text).digest('hex')}; mutate?.(envelope); return JSON.parse(context.doPost({postData:{contents:JSON.stringify(envelope)}}).value); };
  return {context,properties,files,sheets,call,failUpload:index=>{failUpload=index;},failSheet:state=>{failSheet=state;},lock:()=>{locked=true;},releases:()=>releases};
}

test('receiver requires valid signature and fresh request before touching storage',()=>{
  const app=fixture();
  assert.equal(app.call(record(),envelope=>{envelope.signature='b'.repeat(64);}).code,'denied');
  assert.equal(app.call({...record(),issuedAt:1}).code,'invalid');
  assert.equal(app.files.size,1); assert.equal(app.sheets['Konfirmasi Donasi'].rows.length,1);
});

test('confirmed rows preserve numeric amounts, escape formulas, and contain only a private attachment link',()=>{
  const app=fixture(), data=record(['%PDF-1.4\nDATA UJI']);
  const result=app.call(data);
  assert.deepEqual(result,{ok:true,id,kind:'donasi'});
  const row=app.sheets['Konfirmasi Donasi'].rows[1];
  assert.equal(row[3],"'=Tidak dieksekusi"); assert.equal(row[4],12345); assert.ok(row[1] instanceof Date);
  assert.match(row[8],/^https:\/\/drive.google.com\/drive\/folders\//);
  const uploaded=[...app.files.values()].find(file=>file.blob);
  assert.deepEqual(Buffer.from(uploaded.blob.bytes),Buffer.from('%PDF-1.4\nDATA UJI'));
  assert.equal(uploaded.owners[0].emailAddress,owner);
});

test('same-ID retries are acknowledged once; changed content cannot overwrite the original',()=>{
  const app=fixture(), data=record(['%PDF-1.4 test']);
  assert.equal(app.call(data).ok,true); const count=app.files.size;
  assert.equal(app.call({...data,issuedAt:data.issuedAt+1}).ok,true);
  assert.equal(app.files.size,count); assert.equal(app.sheets['Konfirmasi Donasi'].rows.length,2);
  assert.equal(app.call({...data,payload:{...data.payload,jumlah:'99999'}}).code,'conflict');
  assert.equal(app.sheets['Konfirmasi Donasi'].rows[1][4],12345);
});

test('partial upload or Sheet failure retries reuse private folders and uploaded bytes',()=>{
  for(const failure of ['upload','sheet']) {
    const app=fixture(), data=record(['%PDF-1.4 one','%PDF-1.4 two']);
    if(failure==='upload') app.failUpload(1); else app.failSheet(true);
    assert.equal(app.call(data).ok,false); assert.equal(app.sheets['Konfirmasi Donasi'].rows.length,1);
    app.failUpload(-1);app.failSheet(false);
    assert.equal(app.call(data).ok,true);
    assert.equal(app.files.size,4); // Root, request folder, two exact files.
    assert.equal(app.sheets['Konfirmasi Donasi'].rows.length,2);
  }
});

test('storage shared outside owner, wrong file digest, and lock contention fail without acknowledgement',()=>{
  const shared=fixture(); shared.files.get(shared.properties.ANNAHL_UPLOADS_FOLDER_ID).permissions=[{type:'anyone',role:'reader'}];
  assert.equal(shared.call(record()).code,'storage_private');
  const wrong=fixture(), data=record(['%PDF-1.4']); data.files[0].sha256='0'.repeat(64);
  assert.equal(wrong.call(data).code,'invalid'); assert.equal(wrong.files.size,1);
  const busy=fixture();busy.lock();assert.equal(busy.call(record()).code,'busy');assert.equal(busy.releases(),0);
});
