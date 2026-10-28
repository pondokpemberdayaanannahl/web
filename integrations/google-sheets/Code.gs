// Direct website forms -> owner's Google Sheets + private Drive.
// Deploy as the pondok account, execute as owner. Only signed hosting requests are accepted.
const ANNAHL_OWNER_EMAIL = 'pondokpemberdayaanannahl@gmail.com';
const ANNAHL_SPREADSHEET = '1GJJDb0AEv4a3yugzQpv2hMhU1ke9g_zIbsNGQMNlmg8';
const ANNAHL_FORMS = {
  pendaftaran: {
    name: 'Pendaftaran',
    headers: ['ID Kiriman','Diterima','Status','Nama Santri','Tempat Lahir','Tanggal Lahir','Jenis Kelamin','Asal Sekolah','Program','Nama Wali','WhatsApp','Email','Alamat'],
    fields: ['nama','tempatLahir','tanggalLahir','jenisKelamin','asalSekolah','program','namaWali','noWA','email','alamat'],
  },
  donasi: {
    name: 'Konfirmasi Donasi',
    headers: ['ID Kiriman','Diterima','Status Pemeriksaan','Nama Donatur','Nominal Dikonfirmasi (Rp)','Metode','Program','Pesan'],
    fields: ['nama','jumlah','metode','program','pesan'],
  },
};
const ANNAHL_EXTRA_COLUMNS = ['Lampiran (Drive)','Hash Kiriman','Folder Berkas'];

function onOpen(event) {
  if (!event || !event.source) return;
  SpreadsheetApp.getUi().createMenu('An-Nahl').addItem('Periksa penyimpanan formulir','checkGoogleFormsSetup').addToUi();
}

function formsError_(code) { const error = new Error(code); error.formCode = code; return error; }
function formsConfig_() {
  const values = PropertiesService.getScriptProperties().getProperties();
  if (values.ANNAHL_SPREADSHEET_ID !== ANNAHL_SPREADSHEET || !/^[a-f0-9]{64}$/.test(values.ANNAHL_SHEETS_SECRET || '')) throw formsError_('not_ready');
  return { secret: values.ANNAHL_SHEETS_SECRET, folderId: values.ANNAHL_UPLOADS_FOLDER_ID || '' };
}
function formsBook_() { return SpreadsheetApp.openById(ANNAHL_SPREADSHEET); }
function formsHex_(bytes) { return bytes.map(function(value) { return ('0' + (value & 255).toString(16)).slice(-2); }).join(''); }
function formsDigest_(value) { return formsHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)); }
function formsLiteral_(value) {
  const text = value == null ? '' : String(value);
  return /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? "'" + text : text;
}
function formsPrivate_(id) {
  const file = Drive.Files.get(id, {fields:'id,mimeType,ownedByMe,owners(emailAddress),trashed,appProperties'});
  if (!file.ownedByMe || file.trashed || !file.owners || file.owners.length !== 1 || file.owners[0].emailAddress.toLowerCase() !== ANNAHL_OWNER_EMAIL) throw formsError_('storage_owner');
  const access = Drive.Permissions.list(id, {fields:'permissions(type,role,emailAddress),nextPageToken'});
  if (access.nextPageToken || !access.permissions || !access.permissions.length || access.permissions.some(function(item) {
    return item.type !== 'user' || item.role !== 'owner' || String(item.emailAddress).toLowerCase() !== ANNAHL_OWNER_EMAIL;
  })) throw formsError_('storage_private');
  return file;
}
function formsFolder_(config) {
  if (!/^[\w-]{20,}$/.test(config.folderId)) throw formsError_('not_ready');
  if (formsPrivate_(config.folderId).mimeType !== 'application/vnd.google-apps.folder') throw formsError_('not_ready');
  return config.folderId;
}
function formsSheet_(book, schema) {
  const sheet = book.getSheetByName(schema.name);
  const expected = schema.headers.concat(ANNAHL_EXTRA_COLUMNS);
  if (!sheet || sheet.getLastRow() < 1 || sheet.getRange(1,1,1,expected.length).getValues()[0].some(function(value,index) { return value !== expected[index]; })) throw formsError_('sheet_schema');
  return sheet;
}

function setupGoogleForms() {
  const config = formsConfig_();
  const book = formsBook_();
  // Check existing source columns before creating folders or extending sheets.
  Object.keys(ANNAHL_FORMS).forEach(function(kind) {
    const schema = ANNAHL_FORMS[kind], sheet = book.getSheetByName(schema.name);
    if (!sheet || sheet.getRange(1,1,1,schema.headers.length).getValues()[0].some(function(value,index) { return value !== schema.headers[index]; })) throw formsError_('sheet_schema');
  });
  if (!config.folderId) {
    const folder = Drive.Files.create({name:'An-Nahl - Berkas Pendaftaran dan Donasi',mimeType:'application/vnd.google-apps.folder',appProperties:{annahl:'forms-root'}});
    formsPrivate_(folder.id);
    PropertiesService.getScriptProperties().setProperty('ANNAHL_UPLOADS_FOLDER_ID',folder.id);
    config.folderId = folder.id;
  }
  formsFolder_(config);
  Object.keys(ANNAHL_FORMS).forEach(function(kind) {
    const schema = ANNAHL_FORMS[kind], sheet = book.getSheetByName(schema.name), base = schema.headers.length;
    if (sheet.getRange(1,base+1,1,3).getValues()[0].some(function(value,index) { return value !== ANNAHL_EXTRA_COLUMNS[index]; })) {
      // Insert rather than overwrite any existing staff-note columns.
      sheet.insertColumnsAfter(base,3);
      sheet.getRange(1,base+1,1,3).setValues([ANNAHL_EXTRA_COLUMNS]);
    }
    sheet.getRange(1,1,1,base+3).setBackground('#c6dfbc').setFontWeight('bold').setWrap(true).setVerticalAlignment('middle');
    sheet.setFrozenRows(1); sheet.setRowHeight(1,48); sheet.setColumnWidths(1,base+1,160); sheet.setColumnWidth(1,280); sheet.setColumnWidth(base+1,280);
    sheet.hideColumns(base+2,2);
    const filter = sheet.getFilter();
    if (filter) filter.remove();
    sheet.getRange(1,1,sheet.getMaxRows(),base+1).createFilter();
  });
  book.setSpreadsheetTimeZone('Asia/Jakarta');
  SpreadsheetApp.flush();
  console.info('Rekap dan folder privat akun pondok siap. Belum ada data formulir yang dikirim.');
  return true;
}

function checkGoogleFormsSetup() {
  const config = formsConfig_(), book = formsBook_();
  formsFolder_(config);
  Object.keys(ANNAHL_FORMS).forEach(function(kind) { formsSheet_(book,ANNAHL_FORMS[kind]); });
  console.info('Pemeriksaan berhasil: dua tab siap dan folder Drive hanya dapat diakses pemilik.');
  return true;
}

function formsValidate_(record) {
  const schema = ANNAHL_FORMS[record.kind];
  if (record.version !== 1 || !schema || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.id || '') ||
      !Number.isInteger(record.issuedAt) || Math.abs(Date.now()/1000-record.issuedAt) > 600 || !record.payload || typeof record.payload !== 'object' || Array.isArray(record.payload)) throw formsError_('invalid');
  if (Object.keys(record.payload).some(function(key) { return schema.fields.indexOf(key) < 0; }) || JSON.stringify(record.payload).length > 18000) throw formsError_('invalid');
  schema.fields.forEach(function(key) { if (typeof record.payload[key] !== 'string' || record.payload[key].length > 3000) throw formsError_('invalid'); });
  if (record.payload.nama.trim().length < 2 || record.payload.nama.length > 180) throw formsError_('invalid');
  if (record.kind === 'donasi' && !/^[1-9]\d{0,11}$/.test(record.payload.jumlah)) throw formsError_('invalid');
  if (record.kind === 'pendaftaran' && (!record.payload.namaWali.trim() || !/^\+?[\d\s()-]{8,24}$/.test(record.payload.noWA))) throw formsError_('invalid');
  if (!Array.isArray(record.files) || record.files.length > 3) throw formsError_('invalid');
  const types = ['image/jpeg','image/png','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  let total = 0;
  record.files.forEach(function(file) {
    if (!file || typeof file.name !== 'string' || file.name.length < 1 || file.name.length > 180 || /[\/\\\x00-\x1f]/.test(file.name) || types.indexOf(file.mime) < 0 || !Number.isInteger(file.bytes) || file.bytes < 1 || file.bytes > 2097152 || !/^[a-f0-9]{64}$/.test(file.sha256 || '') || typeof file.data !== 'string' || file.data.length > 2800000) throw formsError_('invalid');
    const bytes = Utilities.base64Decode(file.data);
    if (bytes.length !== file.bytes || formsDigest_(bytes) !== file.sha256) throw formsError_('invalid');
    file.decoded = bytes; total += bytes.length;
  });
  if (total > 5242880) throw formsError_('invalid');
  return formsDigest_(JSON.stringify({kind:record.kind,payload:record.payload,files:record.files.map(function(file) { return {name:file.name,mime:file.mime,bytes:file.bytes,sha256:file.sha256}; })}));
}

function formsExisting_(sheet, id, hash, width) {
  if (sheet.getLastRow() < 2) return false;
  const ids = sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues();
  const matching = [];
  ids.forEach(function(row,index) { if (row[0] === id) matching.push(index+2); });
  if (matching.length > 1) throw formsError_('sheet_schema');
  if (!matching.length) return false;
  if (sheet.getRange(matching[0],width+2).getValue() !== hash) throw formsError_('conflict');
  return true;
}

function formsUpload_(root, record, hash) {
  if (!record.files.length) return '';
  const found = Drive.Files.list({q:"'"+root+"' in parents and trashed = false and appProperties has { key='requestId' and value='"+record.id+"' }",fields:'files(id,appProperties),nextPageToken',pageSize:10});
  if (found.nextPageToken || (found.files || []).length > 1) throw formsError_('storage_conflict');
  let folder = (found.files || [])[0];
  if (folder && folder.appProperties.payloadHash !== hash) throw formsError_('conflict');
  if (!folder) folder = Drive.Files.create({name:record.kind+' - '+record.id,mimeType:'application/vnd.google-apps.folder',parents:[root],appProperties:{requestId:record.id,payloadHash:hash}});
  formsPrivate_(folder.id);
  const existing = Drive.Files.list({q:"'"+folder.id+"' in parents and trashed = false",fields:'files(id,appProperties),nextPageToken',pageSize:20});
  if (existing.nextPageToken) throw formsError_('storage_conflict');
  record.files.forEach(function(file,index) {
    const matches = (existing.files || []).filter(function(item) { return item.appProperties && item.appProperties.fileIndex === String(index); });
    if (matches.length > 1) throw formsError_('storage_conflict');
    if (matches.length) {
      if (matches[0].appProperties.sha256 !== file.sha256) throw formsError_('conflict');
      formsPrivate_(matches[0].id); return;
    }
    const blob = Utilities.newBlob(file.decoded,file.mime,file.name);
    const created = Drive.Files.create({name:file.name,mimeType:file.mime,parents:[folder.id],appProperties:{fileIndex:String(index),sha256:file.sha256}},blob);
    formsPrivate_(created.id);
  });
  return folder.id;
}

function formsSave_(record, hash, config) {
  const root = formsFolder_(config), schema = ANNAHL_FORMS[record.kind], sheet = formsSheet_(formsBook_(),schema), width = schema.headers.length;
  if (formsExisting_(sheet,record.id,hash,width)) return;
  const folder = formsUpload_(root,record,hash);
  const values = [record.id,new Date(),'baru'].concat(schema.fields.map(function(field) {
    if (field === 'jumlah') return Number(record.payload[field]);
    if (field === 'tanggalLahir' && /^\d{4}-\d{2}-\d{2}$/.test(record.payload[field])) return new Date(record.payload[field]+'T00:00:00+07:00');
    return formsLiteral_(record.payload[field]);
  })).concat([folder ? 'https://drive.google.com/drive/folders/'+folder : '',hash,folder]);
  const row = sheet.getLastRow()+1;
  if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),100);
  sheet.getRange(row,1,1,values.length).setNumberFormat('@').setValues([values]);
  sheet.getRange(row,2).setNumberFormat('dd mmm yyyy hh:mm');
  if (record.kind === 'donasi') sheet.getRange(row,5).setNumberFormat('"Rp" #,##0');
  else sheet.getRange(row,6).setNumberFormat('dd mmm yyyy');
  SpreadsheetApp.flush();
}

function formsJson_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return formsJson_({ok:false,code:'post_only'}); }
function doPost(event) {
  let lock;
  try {
    const text = event && event.postData && event.postData.contents;
    if (typeof text !== 'string' || text.length > 29000000) throw formsError_('invalid');
    const envelope = JSON.parse(text), config = formsConfig_();
    if (envelope.scope === 'media') return mediaEnvelope_(envelope,config);
    if (text.length > 7500000) throw formsError_('invalid');
    if (typeof envelope.data !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.signature || '')) throw formsError_('denied');
    const expected = formsHex_(Utilities.computeHmacSha256Signature('annahl.forms.v1:'+envelope.data,config.secret));
    let different = 0;
    for (let i=0;i<64;i++) different |= expected.charCodeAt(i) ^ envelope.signature.charCodeAt(i);
    if (different) throw formsError_('denied');
    const record = JSON.parse(envelope.data), hash = formsValidate_(record);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) { lock = null; throw formsError_('busy'); }
    formsSave_(record,hash,config);
    return formsJson_({ok:true,id:record.id,kind:record.kind});
  } catch (error) {
    return formsJson_({ok:false,code:error.formCode || 'storage_failed'});
  } finally { if (lock) lock.releaseLock(); }
}
