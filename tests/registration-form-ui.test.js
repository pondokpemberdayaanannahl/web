import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { photos } from '../src/data/photos.js';
import { pondokContact } from '../src/data/pondok.js';
import { jenjangCards, defaultLevels } from '../src/pondok-settings.js';
import { registrationTimelineHtml } from '../src/registration-period.js';
import { bindGoogleSubmission, REGISTRATION_ATTACHMENT_HELP } from '../src/google-forms.js';

const pageSource=readFileSync(new URL('../src/pages/pendaftaran.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replaceAll('export ','');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

async function fixture(replies = []) {
  const posts=[], context={photos,pondokContact,jenjangCards,registrationTimelineHtml,REGISTRATION_ATTACHMENT_HELP,window:{},demoSettings:()=>null,
    getRegistrationStatus:async()=>({state:'open',levels:defaultLevels,revision:1,registration:{year:2027,recap_ready:true},opens_on:'2026-01-01',closes_on:'2099-12-31',closesAt:Date.now()/1000+3600,serverTime:Date.now()/1000}),
    setTimeout:(callback,ms)=>{const timer=setTimeout(callback,ms);timer.unref();return timer;},clearTimeout};
  const transport=async(url,options={})=>{
    if(!options.method)return Response.json({ok:true,token:'fixture-token'});
    const body=JSON.parse(options.body);posts.push(body);
    const reply=replies.shift();
    return reply ? reply(body) : Response.json({ok:true,id:body.id,kind:body.kind});
  };
  context.bindGoogleSubmission=(form,kind,collect,message,options)=>bindGoogleSubmission(form,kind,collect,message,{...options,transport});
  vm.runInNewContext(pageSource,context);
  const {document,window}=parseHTML(`<html><body>${context.Pendaftaran()}</body></html>`);
  context.document=document;
  const form=document.getElementById('registration-form'),dialog=document.getElementById('registration-success');
  let focused='',pending;
  function controls(){return [...form.querySelectorAll('input,select,textarea,button')];}
  function enhance(){
    for(const node of [...controls(),...form.querySelectorAll('legend'),document.getElementById('registration-receipt')]){
      node.focus=()=>{focused=node.id;};
      node.setCustomValidity=message=>{node.customError=message;};
      node.checkValidity=()=>!node.customError&&(!node.hasAttribute('required')|| (node.type==='radio'?!!form.querySelector('input[name="jenjang"][checked]'):!!node.value));
      node.reportValidity=node.checkValidity;
      if(node.type==='file'&&!Object.hasOwn(node,'files')){
        let files=[],value='';
        Object.defineProperty(node,'files',{configurable:true,get:()=>files,set:next=>{files=next;}});
        Object.defineProperty(node,'value',{configurable:true,get:()=>value,set:next=>{value=next;if(next==='')files=[];}});
      }
    }
  }
  Object.defineProperty(form,'elements',{get:controls});
  form.reset=()=>{for(const node of controls()){if(node.type==='file')node.value='';else if(node.tagName==='INPUT'||node.tagName==='TEXTAREA'){node.value=node.getAttribute('value')||'';node.removeAttribute('checked');}}};
  const add=form.addEventListener.bind(form);
  form.addEventListener=(type,callback,...rest)=>add(type,type==='submit'?event=>{pending=callback(event);}:callback,...rest);
  dialog.open=false;
  dialog.showModal=()=>{dialog.open=true;};
  dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
  enhance();const dispose=context.initPendaftaran();await tick();enhance();
  const click=selector=>document.querySelector(selector).dispatchEvent(new window.Event('click',{bubbles:true}));
  function fill(){
    form.querySelector('input[name="jenjang"]').setAttribute('checked','');
    for(const [id,value]of Object.entries({'reg-nama':'Santri Uji','reg-tempat-lahir':'Bogor','reg-tanggal-lahir':'2013-01-01','reg-asal-sekolah':'Sekolah Uji'}))document.getElementById(id).value=value;
    click('[data-registration-next]');
    for(const [id,value]of Object.entries({'reg-nama-wali':'Wali Uji','reg-no-wa':'000000000000','reg-alamat':'Alamat Uji'}))document.getElementById(id).value=value;
    click('[data-registration-next]');
  }
  function files(id,files){const input=document.getElementById(id);input.files=files;input.dispatchEvent(new window.Event('change',{bubbles:true}));}
  const submit=async()=>{form.dispatchEvent(new window.Event('submit',{cancelable:true}));await pending;await tick();};
  return {document,form,dialog,posts,fill,files,submit,click,dispose,focused:()=>focused};
}

const pdf=name=>new File(['%PDF-1.4 dokumen uji'],name,{type:'application/pdf'});
const photo=()=>new File(['photo bytes'], 'foto.png',{type:'image/png'});

test('registration confirms only acknowledged storage and keeps every document category in the outgoing names',async()=>{
  const ui=await fixture();try{
    ui.fill();
    ui.files('reg-kk-files',[pdf('kk.pdf')]);ui.files('reg-akta-files',[pdf('akta.pdf')]);
    ui.files('reg-rapor-files',[pdf('halaman1.pdf'),pdf('halaman2.pdf')]);ui.files('reg-pasfoto-files',[photo()]);ui.files('reg-ijazah-files',[pdf('ijazah.pdf')]);
    await ui.submit();assert.equal(ui.posts.length,1);
    assert.deepEqual(ui.posts[0].files.map(file=>file.name),['Kartu Keluarga - kk.pdf','Akta kelahiran - akta.pdf','Rapor terakhir 1 - halaman1.pdf','Rapor terakhir 2 - halaman2.pdf','Pas foto - foto.png','Ijazah atau SKL - ijazah.pdf']);
    assert.equal(ui.dialog.open,true);assert.equal(ui.form.hidden,true);assert.equal(ui.document.getElementById('registration-receipt').hidden,false);
    assert.equal(ui.document.querySelector('[data-registration-reference]').textContent,ui.posts[0].id);
    assert.equal(ui.document.getElementById('reg-kk-files').files.length,0);
    ui.click('[data-registration-success-close]');assert.equal(ui.dialog.open,false);assert.equal(ui.focused(),'registration-receipt');
  }finally{ui.dispose();}
});

test('a failed or mismatched acknowledgement retains the filled form and attachments; retry reuses the same request',async()=>{
  for(const failure of [()=>Response.json({ok:false,message:'Belum tersimpan'},{status:502}),()=>Response.json({ok:true,id:'wrong',kind:'pendaftaran'})]){
    const ui=await fixture([failure]);try{
      ui.fill();ui.files('reg-kk-files',[pdf('kk.pdf')]);await ui.submit();
      assert.equal(ui.dialog.open,false);assert.equal(ui.form.hidden,false);assert.equal(ui.document.getElementById('registration-receipt').hidden,true);
      assert.equal(ui.document.getElementById('reg-notif').dataset.state,'error');
      assert.equal(ui.document.getElementById('reg-nama').value,'Santri Uji');assert.equal(ui.document.getElementById('reg-kk-files').files.length,1);
      await ui.submit();assert.equal(ui.posts.length,2);assert.equal(ui.posts[0].id,ui.posts[1].id);assert.equal(ui.dialog.open,true);
    }finally{ui.dispose();}
  }
});

test('invalid photo attachments cannot trigger a POST or success notification',async()=>{
  const ui=await fixture();try{
    ui.fill();ui.files('reg-pasfoto-files',[pdf('bukan-foto.pdf')]);await ui.submit();
    assert.equal(ui.posts.length,0);assert.equal(ui.dialog.open,false);assert.match(ui.document.getElementById('reg-pasfoto-feedback').textContent,/pas foto/);
    ui.files('reg-pasfoto-files',[photo()]);await ui.submit();assert.equal(ui.posts.length,1);assert.equal(ui.dialog.open,true);
  }finally{ui.dispose();}
});
