// Inactive legacy proposal. Not used by the direct Google form receiver.
/** @OnlyCurrentDoc */
// Bound Google Apps Script. Keep secrets in Project Settings > Script properties.
// The two worksheets must be prepared before installing the trigger. No public web app is required.
const ANNAHL_SHEETS = {
  pendaftaran: {
    name: 'Pendaftaran',
    headers: ['ID Kiriman', 'Diterima', 'Status', 'Nama Santri', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Asal Sekolah', 'Program', 'Nama Wali', 'WhatsApp', 'Email', 'Alamat'],
    fields: ['nama', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'asalSekolah', 'program', 'namaWali', 'noWA', 'email', 'alamat'],
  },
  donasi: {
    name: 'Konfirmasi Donasi',
    headers: ['ID Kiriman', 'Diterima', 'Status Pemeriksaan', 'Nama Donatur', 'Nominal Dikonfirmasi (Rp)', 'Metode', 'Program', 'Pesan'],
    fields: ['nama', 'jumlah', 'metode', 'program', 'pesan'],
  },
};

function onOpen(event) {
  // A manual editor run or a clock trigger has no live spreadsheet menu.
  if (!event || !event.source) return;
  SpreadsheetApp.getUi().createMenu('An-Nahl')
    .addItem('Salin data terbaru', 'syncAnNahl')
    .addItem('Aktifkan salin otomatis', 'installAnNahlSync')
    .addItem('Hentikan salin otomatis', 'stopAnNahlSync').addToUi();
}

function checkAnNahlSetup() {
  const config = annahlConfig_();
  const book = annahlBook_(config);
  Object.keys(ANNAHL_SHEETS).forEach(function(kind) { annahlSheet_(book, ANNAHL_SHEETS[kind]); });
  console.info('Konfigurasi dan dua tab rekap siap. Penyalinan data belum dijalankan.');
  return true;
}

function annahlConfig_() {
  const properties = PropertiesService.getScriptProperties().getProperties();
  const url = String(properties.ANNAHL_SUPABASE_URL || '').replace(/\/$/, '');
  const key = properties.ANNAHL_SUPABASE_PUBLIC_KEY || '';
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key || key.startsWith('sb_secret_') ||
      !/^[a-f0-9]{64}$/.test(properties.ANNAHL_SHEETS_SECRET || '') ||
      !/^[\w-]{20,}$/.test(properties.ANNAHL_SPREADSHEET_ID || '')) {
    throw new Error('Konfigurasi integrasi belum lengkap. Periksa Script properties.');
  }
  return { url: url, key: key, secret: properties.ANNAHL_SHEETS_SECRET, spreadsheetId: properties.ANNAHL_SPREADSHEET_ID };
}

function annahlRpc_(config, name, values) {
  const response = UrlFetchApp.fetch(config.url + '/rest/v1/rpc/' + name, {
    method: 'post', contentType: 'application/json',
    headers: { apikey: config.key },
    payload: JSON.stringify(Object.assign({ p_secret: config.secret }, values)),
    muteHttpExceptions: true, followRedirects: false,
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    // Do not log request bodies, credentials, personal data, or upstream error bodies.
    throw new Error('Sambungan Supabase belum berhasil (HTTP ' + status + '). Data akan dicoba lagi.');
  }
  return JSON.parse(response.getContentText());
}

function annahlBook_(config) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book || book.getId() !== config.spreadsheetId) {
    throw new Error('Penghubung harus dipasang pada spreadsheet tujuan yang sudah ditentukan.');
  }
  return book;
}

function annahlText_(value) {
  const text = value == null ? '' : String(value);
  // User input must remain literal text, including a WhatsApp number starting +62.
  return /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? "'" + text : text;
}

function annahlValues_(record) {
  const schema = ANNAHL_SHEETS[record.kind];
  if (!schema || !/^[0-9a-f-]{36}$/i.test(record.id) || !/^[1-9]\d*$/.test(record.revision) ||
      !['baru', 'diproses', 'selesai'].includes(record.status) || !record.payload || typeof record.payload !== 'object') {
    throw new Error('Format data integrasi tidak dikenali. Tidak ada kiriman yang ditandai selesai.');
  }
  const received = new Date(record.dibuat_pada);
  if (!Number.isFinite(received.getTime())) throw new Error('Tanggal kiriman tidak valid.');
  return [record.id, received, record.status].concat(schema.fields.map(function(field) {
    const value = record.payload[field];
    if (field === 'jumlah' && /^[1-9]\d{0,11}$/.test(String(value))) return Number(value);
    if (field === 'tanggalLahir' && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      const date = new Date(value + 'T00:00:00+07:00');
      const check = new Date(value + 'T00:00:00Z');
      if (Number.isFinite(check.getTime()) && check.toISOString().slice(0, 10) === value) return date;
    }
    return annahlText_(value);
  }));
}

function annahlSheet_(book, schema) {
  const sheet = book.getSheetByName(schema.name);
  if (!sheet || sheet.getLastRow() < 1) throw new Error('Tab ' + schema.name + ' belum disiapkan.');
  const headers = sheet.getRange(1, 1, 1, schema.headers.length).getValues()[0];
  if (headers.some(function(value, index) { return value !== schema.headers[index]; })) {
    throw new Error('Kolom tab ' + schema.name + ' berubah. Kembalikan judul kolom sebelum menyalin data.');
  }
  const rows = new Map();
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().forEach(function(row, index) {
      const id = String(row[0]);
      if (!id) return;
      if (rows.has(id)) throw new Error('ID kiriman ganda di tab ' + schema.name + '. Periksa rekap sebelum melanjutkan.');
      rows.set(id, index + 2);
    });
  }
  return { sheet: sheet, rows: rows, nextRow: sheet.getLastRow() + 1 };
}

function annahlWrite_(book, records) {
  const sheets = {};
  records.forEach(function(record) {
    const values = annahlValues_(record);
    const schema = ANNAHL_SHEETS[record.kind];
    const target = sheets[record.kind] || (sheets[record.kind] = annahlSheet_(book, schema));
    let row = target.rows.get(record.id);
    if (!row) { row = target.nextRow++; target.rows.set(record.id, row); }
    if (row > target.sheet.getMaxRows()) target.sheet.insertRowsAfter(target.sheet.getMaxRows(), 100);
    // Only managed columns are written. Extra columns such as Catatan Pengurus stay intact.
    target.sheet.getRange(row, 1, 1, values.length).setNumberFormat('@').setValues([values]);
    target.sheet.getRange(row, 2).setNumberFormat('dd mmm yyyy hh:mm');
    if (record.kind === 'pendaftaran' && values[5] instanceof Date) target.sheet.getRange(row, 6).setNumberFormat('dd mmm yyyy');
    if (record.kind === 'donasi' && typeof values[4] === 'number') target.sheet.getRange(row, 5).setNumberFormat('"Rp" #,##0');
  });
  SpreadsheetApp.flush();
}

function syncAnNahl() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return null;
  const properties = PropertiesService.getScriptProperties();
  try {
    const config = annahlConfig_();
    const book = annahlBook_(config);
    const deadline = Date.now() + 240000;
    let count = 0;
    for (let batch = 0; batch < 5 && Date.now() < deadline; batch++) {
      const records = annahlRpc_(config, 'sheets_sync_pull', { p_limit: 50 });
      if (!Array.isArray(records) || records.length > 50) throw new Error('Respons integrasi tidak valid.');
      if (!records.length) break;
      annahlWrite_(book, records);
      const acknowledged = annahlRpc_(config, 'sheets_sync_ack', { p_receipts: records.map(function(row) { return { id: row.id, revision: row.revision }; }) });
      if (!Number.isInteger(acknowledged) || acknowledged < 0 || acknowledged > records.length) throw new Error('Tanda terima integrasi tidak valid.');
      count += records.length;
    }
    properties.setProperties({ ANNAHL_LAST_SYNC_AT: new Date().toISOString(), ANNAHL_LAST_SYNC_COUNT: String(count), ANNAHL_LAST_SYNC_ERROR: '' });
    return count;
  } catch (error) {
    properties.setProperty('ANNAHL_LAST_SYNC_ERROR', 'Penyalinan belum selesai. Periksa Executions; data tetap tersimpan di Supabase.');
    throw error;
  } finally { lock.releaseLock(); }
}

function installAnNahlSync() {
  // Validate both destination tabs and one complete sync before enabling the schedule.
  const config = annahlConfig_();
  const book = annahlBook_(config);
  Object.keys(ANNAHL_SHEETS).forEach(function(kind) { annahlSheet_(book, ANNAHL_SHEETS[kind]); });
  if (syncAnNahl() === null) throw new Error('Penyalinan sedang berlangsung. Coba aktifkan jadwal lagi setelah selesai.');
  const triggers = ScriptApp.getProjectTriggers().filter(function(trigger) { return trigger.getHandlerFunction() === 'syncAnNahl'; });
  if (!triggers.length) ScriptApp.newTrigger('syncAnNahl').timeBased().everyMinutes(5).create();
  triggers.slice(1).forEach(function(trigger) { ScriptApp.deleteTrigger(trigger); });
}

function stopAnNahlSync() {
  ScriptApp.getProjectTriggers().filter(function(trigger) { return trigger.getHandlerFunction() === 'syncAnNahl'; })
    .forEach(function(trigger) { ScriptApp.deleteTrigger(trigger); });
}
