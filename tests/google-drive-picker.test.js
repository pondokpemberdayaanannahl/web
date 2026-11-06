import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGooglePhotoPicker, importPickedPhoto } from '../src/google-drive-picker.js';

test('native Google Picker opens an image grid with folder selection disabled', () => {
  const previous = globalThis.window;
  globalThis.window = { location: { origin: 'https://pondok.example' }, innerWidth: 390, innerHeight: 800 };
  const settings = {};
  class View {
    constructor(id) { settings.view = id; }
    setMode(mode) { settings.mode = mode; return this; }
    setIncludeFolders(value) { settings.folders = value; return this; }
    setSelectFolderEnabled(value) { settings.selectFolders = value; return this; }
    setMimeTypes(value) { settings.mimes = value; return this; }
  }
  class Builder {
    setAppId(value) { settings.appId = value; return this; }
    setDeveloperKey(value) { settings.key = value; return this; }
    setOAuthToken(value) { settings.token = value; return this; }
    setOrigin(value) { settings.origin = value; return this; }
    setLocale(value) { settings.locale = value; return this; }
    setTitle(value) { settings.title = value; return this; }
    setSize(width, height) { settings.size = [width, height]; return this; }
    addView(view) { assert.ok(view instanceof View); return this; }
    setCallback(value) { settings.callback = value; return this; }
    build() { return settings; }
  }
  try {
    const callback = () => {};
    const google = { picker: { DocsView: View, PickerBuilder: Builder, ViewId: { DOCS_IMAGES: 'images' }, DocsViewMode: { GRID: 'grid' } } };
    const result = buildGooglePhotoPicker(google, 'test-token', { appId: '123', clientId: 'client', apiKey: 'public-key' }, callback);
    assert.equal(result.mode, 'grid');
    assert.equal(result.view, 'images');
    assert.equal(result.folders, false);
    assert.equal(result.selectFolders, false);
    assert.match(result.mimes, /image\/webp/);
    assert.deepEqual(result.size, [370, 640]);
    assert.equal(result.origin, 'https://pondok.example');
    assert.equal(result.callback, callback);
  } finally { globalThis.window = previous; }
});

const fileId = 'google-photo-1234567890';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const info = { id: fileId, name: 'foto.png', mimeType: 'image/png', size: String(png.length) };

test('an existing library photo is reused without downloading or copying it', async () => {
  const photo = { id: 'known', full: '/full', thumbnail: '/thumbnail' };
  const media = { resolve: async id => { assert.equal(id, fileId); return photo; } };
  assert.equal(await importPickedPhoto(fileId, 'token', media, () => { throw Error('Unexpected download'); }), photo);
});

test('selected Google files are downloaded from Google only and imported without forwarding the token', async () => {
  let upload;
  const media = {
    resolve: async () => null,
    upload: async value => { upload = value; return { id: 'imported', full: '/full', thumbnail: '/thumbnail' }; },
  };
  let requests = 0;
  const fetcher = async (url, options) => {
    assert.equal(new URL(url).origin, 'https://www.googleapis.com');
    assert.equal(options.headers.Authorization, 'Bearer token-in-memory');
    assert.equal(options.redirect, 'error');
    requests++;
    return url.includes('fields=') ? Response.json(info) : new Response(png);
  };
  const photo = await importPickedPhoto(fileId, 'token-in-memory', media, fetcher);
  assert.equal(photo.id, 'imported');
  assert.equal(requests, 2);
  assert.deepEqual(Buffer.from(await upload.file.arrayBuffer()), png);
  assert.equal(upload.original.name, 'foto.png');
  assert.ok(!JSON.stringify(upload).includes('token-in-memory'));
});

test('unsupported, oversized, changed and unauthorized files cannot be imported', async () => {
  const media = { resolve: async () => null, upload: async () => { throw Error('Unexpected upload'); } };
  for (const metadata of [
    { ...info, mimeType: 'application/pdf' },
    { ...info, size: String(13 * 1024 * 1024) },
    { ...info, id: 'another-photo-123456' },
  ]) await assert.rejects(importPickedPhoto(fileId, 'token', media, async () => Response.json(metadata)));
  await assert.rejects(importPickedPhoto(fileId, 'token', media, async () => new Response('', { status: 403 })), /belum dapat dibaca/);
  await assert.rejects(importPickedPhoto(fileId, 'token', media,
    async url => url.includes('fields=') ? Response.json(info) : new Response('different bytes')), /Foto berubah/);
  await assert.rejects(importPickedPhoto('../other-domain', 'token', media), /tidak valid/);
});
