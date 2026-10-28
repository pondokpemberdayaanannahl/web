import test from 'node:test';import assert from 'node:assert/strict';
import {createDriveBridge} from '../scripts/drive-request.mjs';
const endpoint='https://script.google.com/macros/s/fixture/exec',secret='a'.repeat(64);
test('Drive transport retries temporary HTML responses with the same photo identity',async()=>{
 const records=[];let retries=0;
 const request=createDriveBridge({endpoint,secret,sleep:async()=>{},onRetry:()=>retries++,fetcher:async(_,options)=>{const envelope=JSON.parse(options.body),record=JSON.parse(envelope.data);records.push(record);return records.length===1?new Response('<html>Temporarily unavailable</html>',{status:502}):new Response(JSON.stringify({ok:true,id:record.id,action:record.action}));}});
 await request('upload',{assetId:'photo-stays-the-same'});assert.equal(retries,1);assert.equal(records[0].assetId,records[1].assetId);assert.notEqual(records[0].id,records[1].id);
});
test('Drive transport refuses unrelated redirects and mismatched receipts',async()=>{
 const badRedirect=createDriveBridge({endpoint,secret,sleep:async()=>{},fetcher:async()=>new Response('',{status:302,headers:{location:'https://unrelated.example'}})});
 await assert.rejects(badRedirect('status'),/Tujuan respons/);
 const wrongReceipt=createDriveBridge({endpoint,secret,sleep:async()=>{},fetcher:async()=>new Response(JSON.stringify({ok:true,id:'wrong',action:'status'}))});
 await assert.rejects(wrongReceipt('status'),/Tanda terima/);
});
