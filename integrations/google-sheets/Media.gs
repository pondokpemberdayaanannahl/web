// Website photos only. Never reads the private registration/donation folder.
const ANNAHL_MEDIA_FIELDS = 'id,name,description,mimeType,parents,createdTime,appProperties,ownedByMe,owners(emailAddress),trashed,size';
function mediaRoot_() {
  const id = PropertiesService.getScriptProperties().getProperty('ANNAHL_MEDIA_FOLDER_ID');
  if (!id || id === PropertiesService.getScriptProperties().getProperty('ANNAHL_UPLOADS_FOLDER_ID')) throw formsError_('media_not_ready');
  const folder = formsPrivate_(id);
  if (folder.mimeType !== 'application/vnd.google-apps.folder' || !folder.appProperties || folder.appProperties.annahl !== 'website-media-root') throw formsError_('media_not_ready');
  return id;
}
function setupWebsiteMedia() {
  formsConfig_();
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('ANNAHL_MEDIA_FOLDER_ID')) {
    const folder = Drive.Files.create({name:'An-Nahl - Perpustakaan Foto Website',mimeType:'application/vnd.google-apps.folder',appProperties:{annahl:'website-media-root'}});
    formsPrivate_(folder.id); properties.setProperty('ANNAHL_MEDIA_FOLDER_ID',folder.id);
  }
  const id = mediaRoot_();
  console.info('Perpustakaan foto website siap. Folder pendaftaran dan donasi tetap terpisah.');
  return {folderUrl:'https://drive.google.com/drive/folders/'+id};
}
function mediaId_(id) { if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id || '')) throw formsError_('invalid'); return id; }
function mediaQuote_(text) { return String(text).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function mediaAsset_(id, root) {
  mediaId_(id);
  const result = Drive.Files.list({q:"'"+root+"' in parents and trashed = false and appProperties has { key='assetId' and value='"+id+"' }",fields:'files('+ANNAHL_MEDIA_FIELDS+'),nextPageToken',pageSize:2});
  if (result.nextPageToken || (result.files || []).length > 1) throw formsError_('storage_conflict');
  const asset = (result.files || [])[0];
  if (asset) formsPrivate_(asset.id);
  return asset;
}
function mediaRow_(asset) {
  const p = asset.appProperties || {};
  return {id:p.assetId,name:asset.name,folder:asset.description || 'Unggahan pengurus',createdAt:asset.createdTime,complete:p.state === 'ready',originalUrl:p.originalId ? 'https://drive.google.com/file/d/'+p.originalId+'/view' : ''};
}
function mediaPart_(record) {
  const part = record.file;
  const original = record.variant === 'original';
  const types = original ? ['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif'] : ['image/jpeg','image/png','image/webp','image/gif'];
  const limit = original ? 20*1024*1024 : 2*1024*1024;
  if (!['original','full','thumbnail'].includes(record.variant) || !part || typeof part.data !== 'string' || part.data.length > Math.ceil(limit/3)*4 || !Number.isInteger(part.bytes) || part.bytes < 1 || part.bytes > limit || !/^[a-f0-9]{64}$/.test(part.sha256 || '') || types.indexOf(part.mime) < 0 || typeof part.name !== 'string' || part.name.length < 1 || part.name.length > 180 || /[\/\\\x00-\x1f]/.test(part.name)) throw formsError_('invalid');
  const bytes = Utilities.base64Decode(part.data);
  if (bytes.length !== part.bytes || formsDigest_(bytes) !== part.sha256) throw formsError_('invalid');
  return {bytes:bytes,mime:part.mime,name:part.name,sha256:part.sha256};
}
function mediaUpload_(record, root) {
  mediaId_(record.assetId);
  if (typeof record.name !== 'string' || !record.name.trim() || record.name.length > 180 || typeof record.folder !== 'string' || record.folder.length > 500) throw formsError_('invalid');
  const part = mediaPart_(record);
  let asset = mediaAsset_(record.assetId,root);
  if (!asset) {
    const created = Drive.Files.create({name:record.name,description:record.folder,mimeType:'application/vnd.google-apps.folder',parents:[root],appProperties:{assetId:record.assetId,state:'uploading',actor:String(record.actor).slice(0,60)}});
    asset = Drive.Files.get(created.id,{fields:ANNAHL_MEDIA_FIELDS});
  }
  formsPrivate_(asset.id);
  const existing = Drive.Files.list({q:"'"+asset.id+"' in parents and trashed = false and appProperties has { key='variant' and value='"+record.variant+"' }",fields:'files(id,appProperties,size),nextPageToken',pageSize:2});
  if (existing.nextPageToken || (existing.files || []).length > 1) throw formsError_('storage_conflict');
  let file = (existing.files || [])[0];
  if (file && (file.appProperties.sha256 !== part.sha256 || Number(file.size) !== part.bytes.length)) throw formsError_('conflict');
  if (!file) file = Drive.Files.create({name:record.variant+' - '+part.name,mimeType:part.mime,parents:[asset.id],appProperties:{variant:record.variant,sha256:part.sha256}},Utilities.newBlob(part.bytes,part.mime,part.name));
  formsPrivate_(file.id);
  const p = Object.assign({},asset.appProperties || {});
  p[record.variant+'Id'] = file.id;
  p.state = p.originalId && p.fullId && p.thumbnailId ? 'ready' : 'uploading';
  Drive.Files.update({appProperties:p},asset.id);
  asset.appProperties = p;
  return {asset:mediaRow_(asset),variant:record.variant,sha256:part.sha256};
}
function mediaImage_(record, root) {
  if (!['full','thumbnail'].includes(record.variant)) throw formsError_('invalid');
  const asset = mediaAsset_(record.assetId,root), p = asset && asset.appProperties || {};
  if (p.state !== 'ready' || !p[record.variant+'Id']) throw formsError_('missing');
  const id = p[record.variant+'Id']; formsPrivate_(id);
  const file = Drive.Files.get(id,{fields:ANNAHL_MEDIA_FIELDS});
  if (!file.parents || file.parents.indexOf(asset.id) < 0 || !['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimeType) || Number(file.size) > 2097152) throw formsError_('invalid');
  // Exact Google API endpoint; the OAuth token never leaves Apps Script/Google.
  const response = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},followRedirects:false,muteHttpExceptions:true});
  if (response.getResponseCode() !== 200) throw formsError_('storage_failed');
  const bytes = response.getContent();
  if (bytes.length !== Number(file.size) || formsDigest_(bytes) !== file.appProperties.sha256) throw formsError_('storage_conflict');
  return {mime:file.mimeType,data:Utilities.base64Encode(bytes),sha256:file.appProperties.sha256};
}
function mediaEnvelope_(envelope, config) {
  const expected = formsHex_(Utilities.computeHmacSha256Signature('annahl.media.v1:'+envelope.data,config.secret));
  if (!/^[a-f0-9]{64}$/.test(envelope.signature || '')) throw formsError_('denied');
  let different = 0;
  for (let i=0;i<64;i++) different |= expected.charCodeAt(i) ^ envelope.signature.charCodeAt(i);
  if (different) throw formsError_('denied');
  const record = JSON.parse(envelope.data);
  if (record.version !== 1 || !Number.isInteger(record.issuedAt) || Math.abs(Date.now()/1000-record.issuedAt) > 600 || !/^[\w-]{1,60}$/.test(record.actor || '') || !/^[a-f0-9-]{36}$/.test(record.id || '')) throw formsError_('invalid');
  const reply = function(data) { return formsJson_(Object.assign({ok:true,id:record.id,action:record.action},data)); };
  if (record.action === 'setup') return reply(setupWebsiteMedia());
  const root = mediaRoot_();
  if (record.action === 'status') return reply({ready:true,folderUrl:'https://drive.google.com/drive/folders/'+root});
  if (record.action === 'list') {
    const search = String(record.search || '').trim().slice(0,100), token = String(record.cursor || '');
    if (token.length > 2000) throw formsError_('invalid');
    const query = "'"+root+"' in parents and trashed = false and appProperties has { key='state' and value='ready' }"+(search ? " and (name contains '"+mediaQuote_(search)+"' or fullText contains '"+mediaQuote_(search)+"')" : '');
    const options = {q:query,fields:'files('+ANNAHL_MEDIA_FIELDS+'),nextPageToken',pageSize:12};
    if (!search) options.orderBy = 'createdTime desc';
    if (token) options.pageToken = token;
    const result = Drive.Files.list(options);
    return reply({photos:(result.files || []).map(mediaRow_),cursor:result.nextPageToken || '',folderUrl:'https://drive.google.com/drive/folders/'+root});
  }
  if (record.action === 'image') return reply(mediaImage_(record,root));
  if (record.action !== 'upload') throw formsError_('invalid');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw formsError_('busy');
  try { return reply(mediaUpload_(record,root)); } finally { lock.releaseLock(); }
}
function checkWebsiteMedia() {
  const root = mediaRoot_();
  const query = "'"+root+"' in parents and trashed = false and appProperties has { key='state' and value='ready' } and (name contains 'Hadroh' or fullText contains 'Hadroh')";
  const result = Drive.Files.list({q:query,fields:'files('+ANNAHL_MEDIA_FIELDS+'),nextPageToken',pageSize:12});
  console.info('Pemeriksaan perpustakaan berhasil: '+(result.files || []).length+' foto Hadroh dapat ditemukan.');
  return true;
}
