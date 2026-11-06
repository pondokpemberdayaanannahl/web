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
  const result = Drive.Files.list({q:"'"+root+"' in parents and trashed = false and appProperties has { key='assetId' and value='"+id+"' }",fields:'files('+ANNAHL_MEDIA_FIELDS+'),nextPageToken',pageSize:3});
  const files = result.files || [];
  if (result.nextPageToken || files.length > 2) throw formsError_('storage_conflict');
  let asset = files[0];
  if (files.length === 2) {
    const photo = files.find(function(file) { return file.appProperties.layout === 'single-file'; });
    const legacy = photo && files.find(function(file) { return file.id === photo.appProperties.legacyFolderId; });
    if (!photo || !legacy || legacy.mimeType !== 'application/vnd.google-apps.folder') throw formsError_('storage_conflict');
    formsPrivate_(legacy.id);
    asset = photo;
  }
  if (asset) formsPrivate_(asset.id);
  return asset;
}
function mediaRow_(asset) {
  const p = asset.appProperties || {};
  const fileId = p.layout === 'single-file' ? asset.id : p.originalId;
  return {id:p.assetId,name:asset.name,folder:asset.description || 'Unggahan pengurus',createdAt:asset.createdTime,complete:p.state === 'ready',originalUrl:fileId ? 'https://drive.google.com/file/d/'+fileId+'/view' : ''};
}
function mediaFilename_(name, mime) {
  const extension = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/heic':'heic','image/heif':'heif'}[mime];
  if (!extension) throw formsError_('invalid');
  return name.replace(/\.[^.]+$/, '').slice(0,170) + '.' + extension;
}
function mediaArchive_() {
  const properties = PropertiesService.getScriptProperties();
  let id = properties.getProperty('ANNAHL_MEDIA_ARCHIVE_FOLDER_ID');
  if (!id) {
    const folder = Drive.Files.create({
      name:'An-Nahl - Arsip Foto Sebelum Perapihan',
      mimeType:'application/vnd.google-apps.folder',
      appProperties:{annahl:'website-media-archive'}
    });
    id = folder.id;
    properties.setProperty('ANNAHL_MEDIA_ARCHIVE_FOLDER_ID', id);
  }
  const folder = formsPrivate_(id);
  if (folder.mimeType !== 'application/vnd.google-apps.folder' || folder.appProperties.annahl !== 'website-media-archive') throw formsError_('media_not_ready');
  return id;
}
function mediaArchiveLegacy_(folderId, assetId, root) {
  const folder = Drive.Files.get(folderId,{fields:ANNAHL_MEDIA_FIELDS});
  formsPrivate_(folderId);
  if (folder.mimeType !== 'application/vnd.google-apps.folder' || folder.appProperties.assetId !== assetId) throw formsError_('storage_conflict');
  if (!folder.parents || folder.parents.indexOf(root) < 0) return;
  const archive = mediaArchive_();
  Drive.Files.update({appProperties:Object.assign({},folder.appProperties,{state:'archived'})}, folderId, null, {addParents:archive,removeParents:root});
}
function mediaFlattenAsset_(folder, root) {
  const assetId = folder.appProperties.assetId;
  const current = mediaAsset_(assetId, root);
  if (current.appProperties.layout === 'single-file') {
    mediaArchiveLegacy_(folder.id, assetId, root);
    return current;
  }
  const fullId = folder.appProperties.fullId;
  if (!fullId) throw formsError_('missing');
  const full = Drive.Files.get(fullId,{fields:ANNAHL_MEDIA_FIELDS});
  formsPrivate_(fullId);
  if (!full.parents || full.parents.indexOf(folder.id) < 0 ||
      !['image/jpeg','image/png','image/webp','image/gif'].includes(full.mimeType) ||
      Number(full.size) > 2097152 || !/^[a-f0-9]{64}$/.test(full.appProperties.sha256 || '')) throw formsError_('storage_conflict');
  let sourceSha256 = full.appProperties.sha256;
  if (folder.appProperties.originalId) {
    const original = Drive.Files.get(folder.appProperties.originalId,{fields:ANNAHL_MEDIA_FIELDS});
    formsPrivate_(original.id);
    if (!original.parents || original.parents.indexOf(folder.id) < 0 || !/^[a-f0-9]{64}$/.test(original.appProperties.sha256 || '')) throw formsError_('storage_conflict');
    sourceSha256 = original.appProperties.sha256;
  }
  Drive.Files.update({appProperties:Object.assign({},folder.appProperties,{state:'migrating'})},folder.id);
  Drive.Files.update({
    name:mediaFilename_(folder.name,full.mimeType),
    description:folder.description || 'Unggahan pengurus',
    appProperties:{assetId:assetId,layout:'single-file',state:'ready',sha256:full.appProperties.sha256,sourceSha256:sourceSha256,legacyFolderId:folder.id}
  },fullId,null,{addParents:root,removeParents:folder.id});
  const photo = Drive.Files.get(fullId,{fields:ANNAHL_MEDIA_FIELDS});
  mediaArchiveLegacy_(folder.id, assetId, root);
  return photo;
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
  let reused = false;
  if (record.sourceSha256 !== undefined && !/^[a-f0-9]{64}$/.test(record.sourceSha256)) throw formsError_('invalid');
  if (asset && asset.mimeType === 'application/vnd.google-apps.folder' && asset.appProperties.fullId) asset = mediaFlattenAsset_(asset,root);
  let legacyFolderId = '';
  if (asset && asset.mimeType === 'application/vnd.google-apps.folder') {
    legacyFolderId = asset.id;
    if (asset.appProperties.originalId && record.variant === 'original') {
      const original = Drive.Files.get(asset.appProperties.originalId,{fields:ANNAHL_MEDIA_FIELDS});
      formsPrivate_(original.id);
      if (!original.parents || original.parents.indexOf(asset.id) < 0 || original.appProperties.sha256 !== part.sha256) throw formsError_('conflict');
      return {asset:mediaRow_(asset),variant:record.variant,sha256:part.sha256};
    }
    asset = null;
  }
  if (record.variant === 'thumbnail') {
    if (!asset || asset.appProperties.state !== 'ready') throw formsError_('missing');
  } else if (!asset) {
    const properties = {
      assetId:record.assetId,layout:'single-file',
      state:record.variant === 'full' ? 'ready' : 'uploading',
      sha256:part.sha256,sourceSha256:record.sourceSha256 || part.sha256,
      actor:String(record.actor).slice(0,60)
    };
    if (legacyFolderId) properties.legacyFolderId = legacyFolderId;
    const created = Drive.Files.create({
      name:mediaFilename_(record.name,part.mime),description:record.folder,mimeType:part.mime,parents:[root],appProperties:properties
    },Utilities.newBlob(part.bytes,part.mime,part.name));
    asset = Drive.Files.get(created.id,{fields:ANNAHL_MEDIA_FIELDS});
  } else {
    if (asset.appProperties.layout !== 'single-file') throw formsError_('storage_conflict');
    const p = Object.assign({},asset.appProperties);
    if (record.sourceSha256 && p.sourceSha256 !== record.sourceSha256) throw formsError_('conflict');
    if (record.variant === 'original') {
      if (p.sourceSha256 !== part.sha256) throw formsError_('conflict');
    } else if (p.state === 'ready') {
      if (p.sha256 !== part.sha256 || Number(asset.size) !== part.bytes.length) {
        if (!record.sourceSha256 || record.sourceSha256 !== p.sourceSha256) throw formsError_('conflict');
        reused = true;
      }
    } else {
      p.state = 'ready';
      p.sha256 = part.sha256;
      Drive.Files.update({
        name:mediaFilename_(record.name,part.mime),mimeType:part.mime,appProperties:p
      },asset.id,Utilities.newBlob(part.bytes,part.mime,part.name));
      asset = Drive.Files.get(asset.id,{fields:ANNAHL_MEDIA_FIELDS});
    }
  }
  formsPrivate_(asset.id);
  if (asset.appProperties.state === 'ready' && asset.appProperties.legacyFolderId) mediaArchiveLegacy_(asset.appProperties.legacyFolderId,record.assetId,root);
  return {asset:mediaRow_(asset),variant:record.variant,sha256:reused ? asset.appProperties.sha256 : part.sha256,sourceSha256:asset.appProperties.sourceSha256,reused:reused};
}
function mediaImage_(record, root) {
  if (!['full','thumbnail'].includes(record.variant)) throw formsError_('invalid');
  const asset = mediaAsset_(record.assetId,root), p = asset && asset.appProperties || {};
  if (!['ready','migrating'].includes(p.state)) throw formsError_('missing');
  const id = p.layout === 'single-file' ? asset.id : p[record.variant+'Id'];
  if (!id) throw formsError_('missing');
  formsPrivate_(id);
  const file = Drive.Files.get(id,{fields:ANNAHL_MEDIA_FIELDS});
  const movedDuringRead = file.appProperties.layout === 'single-file' &&
    file.appProperties.assetId === record.assetId && file.appProperties.legacyFolderId === asset.id;
  const parent = p.layout === 'single-file' || movedDuringRead ? root : asset.id;
  if (!file.parents || file.parents.indexOf(parent) < 0 || !['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimeType) || Number(file.size) > 2097152) throw formsError_('invalid');
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
  if (record.action === 'registration-period') {
    if (!Number.isInteger(record.year) || record.year < 2000 || record.year > 2099) throw formsError_('invalid');
    const periodLock = LockService.getScriptLock();
    if (!periodLock.tryLock(15000)) throw formsError_('busy');
    try {
      const sheet = formsPeriodSheet_(formsBook_(),record.year,true);
      return reply({year:record.year,sheetId:sheet.getSheetId()});
    } finally { periodLock.releaseLock(); }
  }
  const root = mediaRoot_();
  if (record.action === 'status') return reply({ready:true,layout:'single-file',folderUrl:'https://drive.google.com/drive/folders/'+root});
  if (record.action === 'resolve') {
    if (typeof record.fileId !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(record.fileId)) throw formsError_('invalid');
    const assets = mediaLibraryAssets_(root);
    const asset = assets.find(function(file) {
      const properties = file.appProperties || {};
      return properties.state === 'ready' && (file.id === record.fileId ||
        properties.originalId === record.fileId || properties.fullId === record.fileId || properties.thumbnailId === record.fileId);
    });
    return reply({asset:asset ? mediaRow_(asset) : null});
  }
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

function mediaLibraryAssets_(root) {
  const assets = [];
  let cursor = '';
  do {
    const options = {
      q:"'"+root+"' in parents and trashed = false",
      fields:'files('+ANNAHL_MEDIA_FIELDS+'),nextPageToken',
      pageSize:100
    };
    if (cursor) options.pageToken = cursor;
    const page = Drive.Files.list(options);
    for (const file of page.files || []) {
      if (file.appProperties && file.appProperties.assetId) assets.push(file);
    }
    cursor = page.nextPageToken || '';
  } while (cursor);
  return assets;
}

function inspectWebsiteMediaLayout() {
  const assets = mediaLibraryAssets_(mediaRoot_());
  const result = {
    singleFilePhotos:assets.filter(function(file) { return file.appProperties.layout === 'single-file' && file.appProperties.state === 'ready'; }).length,
    legacyFolders:assets.filter(function(file) { return file.mimeType === 'application/vnd.google-apps.folder'; }).length,
    incompletePhotos:assets.filter(function(file) { return file.appProperties.state === 'uploading'; }).length
  };
  console.info(JSON.stringify(result));
  return result;
}

// Run manually in Apps Script. Each run moves at most ten existing photos.
// IDs and signed website links are preserved. Legacy files move into a private archive.
function migrateWebsiteMediaToSingleFiles() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw formsError_('busy');
  try {
    const root = mediaRoot_();
    const folders = mediaLibraryAssets_(root).filter(function(file) {
      return file.mimeType === 'application/vnd.google-apps.folder' && file.appProperties.fullId;
    });
    const batch = folders.slice(0,10);
    for (const folder of batch) mediaFlattenAsset_(folder,root);
    const result = {migrated:batch.length,remaining:Math.max(0,folders.length-batch.length)};
    console.info(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}
