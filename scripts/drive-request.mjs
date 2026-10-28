import { createHmac,randomUUID } from 'node:crypto';
export function createDriveBridge({endpoint,secret,fetcher=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),onRetry=()=>{}}) {
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint || '') || !/^[a-f0-9]{64}$/.test(secret || ''))throw Error('Konfigurasi penghubung Drive tidak sesuai.');
  return async function request(action,body={}) {
    for(let attempt=0;attempt<6;attempt++) {
      const record={version:1,id:randomUUID(),issuedAt:Math.floor(Date.now()/1000),actor:'local-import',action,...body},data=JSON.stringify(record);
      const envelope=JSON.stringify({scope:'media',data,signature:createHmac('sha256',secret).update('annahl.media.v1:'+data).digest('hex')});
      let response,reply,temporary='';
      try {
        response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:envelope,redirect:'manual',signal:AbortSignal.timeout(100000)});
        if([302,303].includes(response.status)) {
          const next=new URL(response.headers.get('location'));
          if(next.protocol!=='https:' || next.hostname!=='script.googleusercontent.com' || next.username || next.password)throw Object.assign(Error('Tujuan respons Google tidak sesuai.'),{fatal:true});
          response=await fetcher(next,{redirect:'error',signal:AbortSignal.timeout(100000)});
        }
        const text=await response.text();
        if(text.length>4000000)throw Object.assign(Error('Respons foto melebihi batas.'),{fatal:true});
        try{reply=JSON.parse(text);}catch{temporary=`respons Google ${response.status} belum sesuai`;}
      } catch(error) { if(error.fatal)throw error;temporary='koneksi Google terputus'; }
      if(reply && response.ok && reply.ok===true) {
        if(reply.id!==record.id || reply.action!==action)throw Error('Tanda terima Google tidak sesuai. Pengiriman dihentikan.');
        return reply;
      }
      if(!temporary && ([429,500,502,503,504].includes(response?.status) || ['busy','storage_failed'].includes(reply?.code)))temporary=reply?.code || `HTTP ${response.status}`;
      if(!temporary)throw Error(`Penghubung Drive menolak permintaan (${reply?.code || response?.status || 'unknown'}).`);
      if(attempt===5)throw Error(`Pengiriman Google belum selesai setelah enam percobaan (${temporary}). Jalankan ulang untuk melanjutkan foto yang tersisa.`);
      onRetry({attempt:attempt+1,reason:temporary});await sleep(Math.min(15000,2000*(attempt+1)));
    }
  };
}
