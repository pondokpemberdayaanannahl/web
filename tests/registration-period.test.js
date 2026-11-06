import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { demoRegistrationStatus, registrationTimeline, registrationTimelineHtml, validateRegistration } from '../src/registration-period.js';
import { prepareRegistrationSheet } from '../src/registration-admin.js';

const values = {year:'2027',opens_on:'2026-11-01',closes_on:'2026-11-03',selection_opens_on:'2026-11-10',selection_closes_on:'2026-11-12',announcement_on:'2026-11-15',information:'Siapkan berkas.'};
const settings = {opens_on:values.opens_on,closes_on:values.closes_on,levels:[{title:'SD',description:''}],registration:{...validateRegistration(values),recap_ready:true},revision:2};

test('date corrections stay in the same year while invalid phase ordering is refused',()=>{
  assert.equal(validateRegistration({...values,closes_on:'2026-11-09'}).year,2027);
  for (const changed of [{closes_on:'2026-10-31'},{closes_on:'2026-11-11'},{selection_closes_on:''},{announcement_on:'2026-11-12'},{opens_on:'2026-02-31'},{year:'2027.5'}]) assert.throws(()=>validateRegistration({...values,...changed}));
});
test('WIB boundaries lock a registration until a recap is ready and close after the final day',()=>{
  const at = text => Date.parse(text+'+07:00');
  assert.equal(demoRegistrationStatus(settings,at('2026-11-01T00:00:00')).state,'open');
  assert.equal(demoRegistrationStatus(settings,at('2026-11-03T23:59:59')).state,'open');
  assert.equal(demoRegistrationStatus(settings,at('2026-11-04T00:00:00')).state,'closed');
  assert.equal(demoRegistrationStatus({...settings,registration:{...settings.registration,recap_ready:false}},at('2026-11-02T12:00:00')).state,'preparing');
});
test('the public timeline follows server time, escapes staff information and distinguishes stage progress from acceptance',()=>{
  const timeline = registrationTimeline(settings,Date.parse('2026-11-11T12:00:00+07:00'));
  assert.equal(timeline.value,2);assert.equal(timeline.stages[1].state,'current');
  const html=registrationTimelineHtml({...settings,serverTime:Date.parse('2026-11-11T12:00:00+07:00')/1000,registration:{...settings.registration,information:'<script>alert(1)</script>'}});
  const {document}=parseHTML(html);
  assert.equal(document.querySelector('script'),null);
  assert.match(document.querySelector('.admission-information').textContent,/<script>/);
  assert.equal(document.querySelector('[aria-current]').textContent.includes('Seleksi'),true);
  assert.match(document.querySelector('.admission-timeline-note').textContent,/Hasil seleksi setiap calon santri/);
});
test('recap setup uses an authenticated same-site request and requires an exact year and sheet acknowledgement',async()=>{
  const client={auth:{getSession:async()=>({data:{session:{access_token:'admin-token'}},error:null})}};
  const saved={registration:{year:2027,recap_ready:true,recap_sheet_id:123}};
  const result=await prepareRegistrationSheet(client,2027,async(url,options)=>{
    assert.equal(url,'/api/registration.php');assert.equal(options.headers.Authorization,'Bearer admin-token');assert.deepEqual(JSON.parse(options.body),{year:2027});return Response.json({ok:true,settings:saved});
  });
  assert.deepEqual(result,saved);
  for(const reply of [{ok:true,settings:{registration:{year:2028,recap_ready:true,recap_sheet_id:123}}},{ok:true,settings:{registration:{year:2027,recap_ready:false,recap_sheet_id:123}}},{ok:false,message:'Belum siap'}]) await assert.rejects(prepareRegistrationSheet(client,2027,async()=>Response.json(reply)));
});
