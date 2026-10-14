const donationDB=()=>new Promise((resolve,reject)=>{const req=indexedDB.open('annahl-donation-drafts',1);req.onupgradeneeded=()=>req.result.createObjectStore('drafts',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('Penyimpanan draft tidak tersedia di browser ini.'));});
async function draftStore(action,value){const db=await donationDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('drafts',action==='get'?'readonly':'readwrite');const store=tx.objectStore('drafts');const req=action==='get'?store.get(value):action==='put'?store.put(value):store.delete(value);let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(Error('Draft donasi gagal disimpan.'));tx.onabort=()=>reject(Error('Draft donasi gagal disimpan.'));});}finally{db.close();}}
async function cleanupDrafts(){const db=await donationDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts'),req=store.openCursor();req.onsuccess=()=>{const cursor=req.result;if(cursor){if((cursor.value.savedAt||0)<Date.now()-86400000)cursor.delete();cursor.continue();}};tx.oncomplete=resolve;tx.onerror=reject;});}finally{db.close();}}
const donationEl=id=>document.getElementById(id);
function donationError(text){donationEl('donationMessage').textContent=text;}
function receiptRead(id){try{const value=JSON.parse(sessionStorage.getItem('annahl-donation-receipt')||'null');return value?.id===id?value:null;}catch{return null;}}
document.addEventListener('DOMContentLoaded',async()=>{
 if(!donationEl('donationMessage'))return;
 const params=new URLSearchParams(location.search),draftId=params.get('draft');
 try{
  if(!donationEl('donationSuccessView'))await cleanupDrafts();
  if(donationEl('donationForm')) {
   let draft=draftId?await draftStore('get',draftId):null;
   if(draftId&&!draft){const receipt=receiptRead(draftId);if(receipt){location.replace('donasi-berhasil.html?receipt='+draftId);return;}throw Error('Draft tidak ditemukan atau sudah kedaluwarsa. Mulai lagi dari postingan donasi.');}
   const program=params.get('program')||draft?.postId;
   const campaign=(await api('posts')).find(p=>p.id===program&&p.type==='donasi');
   if(!campaign)throw Error('Program donasi tidak ditemukan. Pilih program dari beranda.');
   if(campaign.status!=='berjalan')throw Error('Program donasi ini sudah selesai.');
   donationEl('campaignTitle').textContent=campaign.title;
   document.title='Donasi: '+campaign.title+' | An-Nahl';
   donationEl('campaignDescription').textContent=campaign.content;
   const campaignImage=donationEl('campaignImage');
   if(campaign.image){campaignImage.src=campaign.image;campaignImage.alt='Penggalangan dana '+campaign.title;campaignImage.hidden=false;}
   const campaignPercent=Math.min(100,campaign.collected/campaign.target*100);
   donationEl('campaignProgress').innerHTML=`<div class="donation-values"><strong>${rupiah(campaign.collected)}</strong><span>${Math.round(campaignPercent)}%</span></div><progress value="${campaignPercent}" max="100" aria-label="Progress penggalangan dana ${esc(campaign.title)}">${Math.round(campaignPercent)}%</progress><div class="donation-target">Target ${rupiah(campaign.target)}</div>`;
   donationEl('donorAmount').setAttribute('aria-description','Donasi untuk '+campaign.title);
   let proof=draft?.proof||'',fileLoading=false;const id=draft?.id||crypto.randomUUID();
   if(draft){donationEl('donorName').value=draft.name==='Anonim'?'':draft.name;donationEl('donorRegion').value=draft.region;donationEl('donorAmount').value=draft.amount;donationEl('donorPrayer').value=draft.prayer;donationEl('proofPreview').src=proof;donationEl('proofPreview').hidden=!proof;}
   donationEl('donationFormView').hidden=false;
   donationEl('donorProof').addEventListener('change',async()=>{
    const file=donationEl('donorProof').files[0];proof='';donationEl('proofPreview').hidden=true;if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){donationError('Gunakan foto JPG, PNG, atau WebP maksimal 5 MB.');donationEl('donorProof').value='';return;}
    fileLoading=true;donationEl('donationNext').disabled=true;
    try{proof=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Foto bukti gagal dibaca.'));r.readAsDataURL(file);});donationEl('proofPreview').src=proof;donationEl('proofPreview').hidden=false;donationError('');}catch(e){donationError(e.message);}finally{fileLoading=false;donationEl('donationNext').disabled=false;}
   });
   donationEl('donationForm').onsubmit=async e=>{e.preventDefault();if(fileLoading)return;const button=donationEl('donationNext');button.disabled=true;try{const amount=Number(donationEl('donorAmount').value);if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Nominal harus berupa rupiah bulat lebih dari nol.');if(!proof)throw Error('Upload foto bukti donasi sebelum melanjutkan.');const data={id,postId:campaign.id,postTitle:campaign.title,name:donationEl('donorName').value.trim()||'Anonim',region:donationEl('donorRegion').value.trim(),amount,prayer:donationEl('donorPrayer').value.trim(),proof,savedAt:Date.now()};await draftStore('put',data);location.assign('konfirmasi-donasi.html?draft='+id);}catch(err){donationError(err.message);button.disabled=false;}};
  }
  if(donationEl('donationConfirmView')){
   const draft=draftId&&await draftStore('get',draftId);if(!draft){if(receiptRead(draftId)){location.replace('donasi-berhasil.html?receipt='+draftId);return;}throw Error('Draft tidak ditemukan. Silakan isi form donasi terlebih dahulu.');}
   donationEl('donationConfirmView').hidden=false;
   donationEl('donationEdit').href='donasi.html?draft='+encodeURIComponent(draft.id);
   donationEl('donationSummary').innerHTML=`<dl class="donation-summary"><div><dt>Program</dt><dd>${esc(draft.postTitle)}</dd></div><div><dt>Nama</dt><dd>${esc(draft.name)}</dd></div><div><dt>Asal daerah</dt><dd>${esc(draft.region)}</dd></div><div><dt>Nominal</dt><dd class="receipt-amount">${rupiah(draft.amount)}</dd></div><div><dt>Doa & harapan</dt><dd>${esc(draft.prayer||'—')}</dd></div></dl><details class="proof-details"><summary>Lihat foto bukti donasi</summary><img class="donation-proof" src="${esc(draft.proof)}" alt="Foto bukti donasi Anda"></details>`;
   donationEl('donationSubmit').onclick=async()=>{const button=donationEl('donationSubmit');button.disabled=true;button.textContent='Menyimpan donasi…';donationEl('donationEdit').hidden=true;donationError('');try{const receipt=await api('donations','POST',{submissionId:draft.id,postId:draft.postId,name:draft.name,region:draft.region,amount:draft.amount,prayer:draft.prayer,proof:draft.proof});try{sessionStorage.setItem('annahl-donation-receipt',JSON.stringify({...receipt,postTitle:draft.postTitle}));}catch{}try{await draftStore('delete',draft.id);}catch{}location.replace('donasi-berhasil.html?receipt='+encodeURIComponent(receipt.id));}catch(e){donationError(e.message);button.disabled=false;button.textContent='Submit donasi →';donationEl('donationEdit').hidden=false;}};
  }
  if(donationEl('donationSuccessView')){const receipt=receiptRead(params.get('receipt'));if(!receipt)throw Error('Tanda terima tidak tersedia di sesi ini. Silakan lihat perkembangan donasi di beranda.');donationEl('donationSuccessView').hidden=false;donationEl('donationReceipt').innerHTML=`<strong class="receipt-amount">${rupiah(receipt.amount)}</strong><p>${esc(receipt.postTitle)}</p><small>${date(receipt.createdAt)}</small><small class="receipt-id">ID donasi: ${esc(receipt.id)}</small>`;}
 }catch(e){donationError(e.message);}
});
