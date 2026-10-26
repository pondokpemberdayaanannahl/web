import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateAttachments, encodeAttachments, getGoogleFormToken, sendGoogleSubmission } from '../src/google-forms.js';

const id = '11111111-2222-4333-8444-555555555555';
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('attachments enforce file type, per-file size, count, and total size', () => {
  for (const files of [[{name:'test.exe',size:10}], [{name:'test.pdf',size:0}], [{name:'test.pdf',size:2097153}], Array.from({length:4}, () => ({name:'test.pdf',size:1})), Array.from({length:3}, () => ({name:'test.pdf',size:2*1024*1024}))]) assert.throws(() => validateAttachments(files));
  assert.doesNotThrow(() => validateAttachments([{name:'Dokumen.DOCX',size:100}, {name:'Foto.jpg',size:100}]));
});

test('file encoding preserves every byte and content hash for reliable retries', async () => {
  const bytes = Uint8Array.from({length:33000}, (_, index) => index % 256);
  const file = new File([bytes], 'uji.pdf', {type:'application/pdf'});
  const [encoded] = await encodeAttachments([file]);
  assert.deepEqual(Buffer.from(encoded.data,'base64'), Buffer.from(bytes));
  assert.equal(encoded.sha256,createHash('sha256').update(bytes).digest('hex'));
  assert.equal(encoded.bytes,bytes.length);
});

test('form client sends to same-site PHP only and verifies the exact acknowledged ID', async () => {
  const calls = [];
  const transport = async (url, options) => { calls.push({url,options}); return response({ok:true,id,kind:'donasi'}); };
  await sendGoogleSubmission('donasi',{nama:'Nama Uji',jumlah:'12345'},id,[],'token','',transport);
  assert.equal(calls[0].url,'/api/forms.php');
  assert.equal(calls[0].options.credentials,'same-origin');
  assert.equal(JSON.parse(calls[0].options.body).id,id);
  await assert.rejects(sendGoogleSubmission('donasi',{nama:'Nama Uji',jumlah:'12345'},id,[],'token','',async () => response({ok:true,id:'different',kind:'donasi'})), /tanda terima/);
});

test('HTTP errors, opaque/HTML replies, and unacknowledged storage never report success', async () => {
  for (const reply of [response({ok:false,message:'Sambungan belum siap'},503), new Response('<html>hosting</html>',{headers:{'Content-Type':'text/html'}}), response({ok:false})]) {
    await assert.rejects(sendGoogleSubmission('donasi',{nama:'Nama Uji',jumlah:'12345'},id,[],'token','',async () => reply));
  }
  await assert.rejects(sendGoogleSubmission('kontak',{nama:'Nama Uji'},id,[],'token','',async () => { throw new Error('Unexpected request'); }), /Jenis/);
});

test('session token retrieval requires an explicit, bounded JSON token', async () => {
  assert.equal(await getGoogleFormToken(async () => response({ok:true,token:'valid-token'})),'valid-token');
  await assert.rejects(getGoogleFormToken(async () => response({ok:true})), /Sesi/);
});
