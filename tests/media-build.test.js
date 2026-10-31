import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {spawnSync} from 'node:child_process';
test('release guard rejects private photo configuration and keys without exposing their contents',()=>{
 const parent=resolve('.backend-backups/drive-media/build-tests');mkdirSync(parent,{recursive:true});const folder=mkdtempSync(join(parent,'release-'));
 try {
  mkdirSync(join(folder,'api'));mkdirSync(join(folder,'assets'));
  for(const name of ['index.html','admin.html','login.html'])writeFileSync(join(folder,name),'<script type="module" src="/assets/app.js"></script>');
  writeFileSync(join(folder,'assets/app.js'),'// Built fixture');writeFileSync(join(folder,'.htaccess'),'DirectoryIndex index.html');
  for(const name of ['forms.php','forms-core.php','media.php','media-core.php','media-image.php','login.php','login-core.php'])writeFileSync(join(folder,'api',name),'<?php // Fixture');
  const check=()=>spawnSync(process.execPath,['scripts/check-hostinger-build.mjs',folder],{encoding:'utf8'});
  assert.equal(check().status,0);
  for(const name of ['media-config.php','login-config.php','signing-key.json','local-ca.pem']) {
   const path=join(folder,name);writeFileSync(path,'PRIVATE_FIXTURE_VALUE');const result=check();
   assert.notEqual(result.status,0);assert.ok(!(result.stdout+result.stderr).includes('PRIVATE_FIXTURE_VALUE'));rmSync(path);
  }
 } finally {const child=relative(parent,folder);assert.ok(child&&!child.startsWith('..')&&!isAbsolute(child));rmSync(folder,{recursive:true,force:true});}
});
