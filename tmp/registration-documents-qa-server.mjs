import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { defaultLevels } from '../src/pondok-settings.js';
const output = 'tmp/registration-documents-browser';
await mkdir(output,{recursive:true});
let requests=[];
const qa = {
  name:'local-registration-fixture-only',
  configureServer(server){
    server.middlewares.use(async(request,response,next)=>{
      const url=new URL(request.url,'http://127.0.0.1:5185');
      if(url.pathname!=='/api/forms.php')return next();
      const reply=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(value));};
      if(request.method==='GET'){
        const now=Date.now()/1000;
        return reply(200,{ok:true,token:'local-test-token',registration:{state:'open',levels:defaultLevels,revision:1,registration:{year:2027,recap_ready:true},opens_on:'2026-01-01',closes_on:'2099-12-31',opensAt:now-86400,closesAt:now+86400,serverTime:now}});
      }
      try{
        let body='';for await(const chunk of request){body+=chunk;if(body.length>22*1024*1024)return reply(413,{ok:false,message:'Kiriman uji terlalu besar.'});}
        const record=JSON.parse(body);
        if(record.kind!=='pendaftaran'||record.payload?.nama!=='UJI FORMULIR LOKAL')return reply(422,{ok:false,message:'Server ini khusus pengujian formulir dengan data rekaan.'});
        requests.push({id:record.id,kind:record.kind,files:record.files.map(file=>({name:file.name,bytes:file.bytes})),acknowledged:requests.length>0});
        await writeFile(output+'/transport.json',JSON.stringify({simulation:true,productionWrites:false,requests},null,2));
        if(requests.length===1)return reply(502,{ok:false,message:'Uji lokal: penyimpanan belum dikonfirmasi. Silakan coba lagi.'});
        reply(200,{ok:true,id:record.id,kind:record.kind});
      }catch{reply(422,{ok:false,message:'Kiriman uji belum sesuai.'});}
    });
  }
};
const server=await createServer({plugins:[qa],server:{host:'127.0.0.1',port:5185,strictPort:true,watch:{ignored:['**/.backend-backups/**','**/output/**','**/tmp/**']}}});
await server.listen();
console.log('Local registration simulation ready at http://127.0.0.1:5185/#/pendaftaran. No production writes.');
