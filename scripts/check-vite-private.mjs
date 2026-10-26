import { createServer } from 'vite';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const server=await createServer({configFile:resolve('vite.config.js'),logLevel:'silent',server:{host:'127.0.0.1',port:0,open:false}});
try {
  await server.listen();
  const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
  const paths=['/annahl-private/forms-config.php','/.backend-backups/sheets-sync/script-properties.json','/@fs/'+encodeURI(resolve('annahl-private/forms-config.php').replaceAll('\\','/'))];
  for(const path of paths){const response=await fetch(origin+path);assert.equal(response.status,403,'Private configuration must be denied over HTTP');await response.body?.cancel();}
  console.log('PASS: direct paths and /@fs cannot serve Google private configuration from Vite.');
} finally {await server.close();}
