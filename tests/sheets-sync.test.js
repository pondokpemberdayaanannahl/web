import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../integrations/google-sheets/legacy/supabase-sync.gs', import.meta.url), 'utf8');
const registrationHeaders = ['ID Kiriman', 'Diterima', 'Status', 'Nama Santri', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Asal Sekolah', 'Program', 'Nama Wali', 'WhatsApp', 'Email', 'Alamat'];
const donationHeaders = ['ID Kiriman', 'Diterima', 'Status Pemeriksaan', 'Nama Donatur', 'Nominal Dikonfirmasi (Rp)', 'Metode', 'Program', 'Pesan'];
const id = 'b1d0c1f0-0000-4000-8000-000000000001';
const registration = () => ({ id, revision: '1', kind: 'pendaftaran', status: 'baru', dibuat_pada: '2026-10-26T09:00:00Z', payload: { nama: '=IMPORTXML("https://example.org")', namaWali: 'Wali', noWA: '+6281200000000', tanggalLahir: '2012-02-10', alamat: 'Bandung' } });

function fixture() {
  let pending = [registration()], writeFails = false, ackFails = false, pullFails = false, wrongBook = false;
  let flushes = 0, ackCalls = 0;
  const store = { ANNAHL_SUPABASE_URL: 'https://example.supabase.co', ANNAHL_SUPABASE_PUBLIC_KEY: 'public-key', ANNAHL_SHEETS_SECRET: 'a'.repeat(64), ANNAHL_SPREADSHEET_ID: 'sheet-id-'.repeat(4) };
  const properties = { getProperties: () => ({ ...store }), setProperties: values => Object.assign(store, values), setProperty: (name, value) => { store[name] = value; } };
  const sheets = {};
  for (const [name, headers] of [['Pendaftaran', registrationHeaders], ['Konfirmasi Donasi', donationHeaders]]) {
    const data = [[...headers]], formats = new Map();
    sheets[name] = {
      data, formats, getLastRow: () => data.length, getMaxRows: () => 1000,
      getRange(row, col, rows = 1, cols = 1) {
        return {
          getValues: () => Array.from({ length: rows }, (_, offset) => Array.from({ length: cols }, (_, column) => data[row - 1 + offset]?.[col - 1 + column] ?? '')),
          setValues(values) {
            if (writeFails) throw new Error('Write failed');
            values.forEach((valuesRow, offset) => {
              data[row - 1 + offset] ||= [];
              valuesRow.forEach((value, index) => { data[row - 1 + offset][col - 1 + index] = value; });
            }); return this;
          },
          setNumberFormat(format) { formats.set(`${row}:${col}`, format); return this; },
        };
      },
    };
  }
  const requests = [], triggers = [], lock = { released: 0, tryLock: () => true, releaseLock() { this.released++; } };
  const context = {
    Map, Date, console, PropertiesService: { getScriptProperties: () => properties }, LockService: { getScriptLock: () => lock },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getId: () => wrongBook ? 'another-spreadsheet' : store.ANNAHL_SPREADSHEET_ID, getSheetByName: name => sheets[name] || null }), flush: () => { flushes++; } },
    ScriptApp: { getProjectTriggers: () => triggers, newTrigger: name => ({ timeBased() { return this; }, everyMinutes(value) { assert.equal(value, 5); return this; }, create() { triggers.push({ getHandlerFunction: () => name }); } }), deleteTrigger: trigger => triggers.splice(triggers.indexOf(trigger), 1) },
    UrlFetchApp: { fetch(url, options) {
      assert.equal(options.followRedirects, false);
      assert.equal(options.headers.apikey, 'public-key');
      const body = JSON.parse(options.payload); assert.equal(body.p_secret, store.ANNAHL_SHEETS_SECRET);
      requests.push({ url, body });
      if (url.endsWith('sheets_sync_pull')) return { getResponseCode: () => pullFails ? 401 : 200, getContentText: () => JSON.stringify(pending) };
      assert.ok(flushes > ackCalls, 'Acknowledge must follow a flushed Sheet write');
      ackCalls++;
      if (ackFails) return { getResponseCode: () => 503 };
      pending = pending.filter(record => !body.p_receipts.some(receipt => receipt.id === record.id && receipt.revision === record.revision));
      return { getResponseCode: () => 200, getContentText: () => '1' };
    } },
  };
  vm.runInNewContext(script, context);
  return { context, sheets, requests, store, triggers, lock, pending: rows => { pending = rows; }, failWrite: value => { writeFails = value; }, failAck: value => { ackFails = value; }, failPull: value => { pullFails = value; }, wrongBook: () => { wrongBook = true; } };
}

test('Sheets sync writes literal user text, preserves phone numbers, and uses typed dates and amounts', () => {
  const app = fixture();
  const donation = { ...registration(), id: 'b1d0c1f0-0000-4000-8000-000000000002', kind: 'donasi', payload: { nama: 'Donatur', jumlah: '500000', metode: 'Transfer', pesan: ' \t=HYPERLINK("https://example.org")' } };
  app.pending([registration(), donation]);
  assert.equal(app.context.syncAnNahl(), 2);
  const santri = app.sheets.Pendaftaran.data[1], donasi = app.sheets['Konfirmasi Donasi'].data[1];
  assert.ok(santri[1] instanceof Date); assert.ok(santri[5] instanceof Date);
  assert.equal(santri[3], '\'=IMPORTXML("https://example.org")');
  assert.equal(santri[10], "'+6281200000000");
  assert.equal(donasi[4], 500000);
  assert.equal(donasi[7], '\' \t=HYPERLINK("https://example.org")');
  assert.equal(app.store.ANNAHL_LAST_SYNC_COUNT, '2');
});

test('failed acknowledgement retries existing IDs without duplicates and preserves staff notes', () => {
  const app = fixture(); app.failAck(true);
  assert.throws(() => app.context.syncAnNahl(), /HTTP 503/);
  app.sheets.Pendaftaran.data[0].push('Catatan Pengurus');
  app.sheets.Pendaftaran.data[1].push('Hubungi besok');
  app.failAck(false);
  assert.equal(app.context.syncAnNahl(), 1);
  assert.equal(app.sheets.Pendaftaran.data.length, 2);
  assert.equal(app.sheets.Pendaftaran.data[1][13], 'Hubungi besok');
  const updated = { ...registration(), revision: '2', status: 'diproses' };
  app.pending([updated]); app.context.syncAnNahl();
  assert.equal(app.sheets.Pendaftaran.data.length, 2);
  assert.equal(app.sheets.Pendaftaran.data[1][2], 'diproses');
});

test('write failure leaves pending records unacknowledged and releases the lock', () => {
  const app = fixture(); app.failWrite(true);
  assert.throws(() => app.context.syncAnNahl(), /Write failed/);
  assert.equal(app.requests.length, 1);
  assert.equal(app.lock.released, 1);
  app.failWrite(false); assert.equal(app.context.syncAnNahl(), 1);
});

test('missing tabs, changed headers, duplicate IDs, and unsupported records stop before acknowledgement', () => {
  for (const change of [
    app => { delete app.sheets.Pendaftaran; },
    app => { app.sheets.Pendaftaran.data[0][0] = 'Salah'; },
    app => { app.sheets.Pendaftaran.data.push([id], [id]); },
    app => { app.pending([{ ...registration(), kind: 'kontak' }]); },
  ]) {
    const app = fixture(); change(app);
    assert.throws(() => app.context.syncAnNahl());
    assert.ok(app.requests.every(request => request.url.endsWith('sheets_sync_pull')));
  }
});

test('authentication failure does not expose the server response or install a schedule', () => {
  const app = fixture(); app.failPull(true);
  assert.throws(() => app.context.installAnNahlSync(), /HTTP 401/);
  assert.equal(app.triggers.length, 0);
  assert.equal(app.sheets.Pendaftaran.data.length, 1);
});

test('installing the Google schedule twice keeps a single five-minute trigger', () => {
  const app = fixture();
  app.context.installAnNahlSync(); app.context.installAnNahlSync();
  assert.equal(app.triggers.length, 1);
  app.context.stopAnNahlSync(); assert.equal(app.triggers.length, 0);
});

test('a copy of the bound script cannot consume pending data for a different spreadsheet', () => {
  const app = fixture(); app.wrongBook();
  assert.throws(() => app.context.installAnNahlSync(), /spreadsheet tujuan/);
  assert.equal(app.requests.length, 0);
  assert.equal(app.triggers.length, 0);
});

test('setup validation and manual onOpen do not need a live menu or start any sync', () => {
  const app = fixture();
  assert.doesNotThrow(() => app.context.onOpen());
  assert.equal(app.context.checkAnNahlSetup(), true);
  assert.equal(app.requests.length, 0);
  assert.equal(app.triggers.length, 0);
});
