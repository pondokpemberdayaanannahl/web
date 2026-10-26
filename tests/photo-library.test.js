import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { filterPhotoLibrary } from '../src/photo-library.js';

const root = new URL('../', import.meta.url);
const rows = JSON.parse(fs.readFileSync(new URL('src/data/photo-library.json', root), 'utf8')).photos;

test('local catalog covers all picture photos exactly once, including HEIC', () => {
  const expected = fs.readdirSync(new URL('picture/', root), { recursive: true }).filter(path => /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(path)).map(path => path.replaceAll('\\', '/')).sort();
  assert.deepEqual(rows.map(row => row.path).sort(), expected);
  assert.equal(new Set(rows.map(row => row.id)).size, expected.length);
  assert.equal(rows.filter(row => row.format === 'HEIC').length, 24);
  for (const row of rows) {
    for (const key of ['full', 'thumbnail']) {
      assert.match(row[key], /^\/media\/[a-f0-9]{16}-(?:1600|480)\.jpg$/);
      const buffer = fs.readFileSync(new URL(`public${row[key]}`, root));
      assert.equal(buffer.readUInt16BE(0), 0xffd8, `${row.path} must have a browser-compatible JPEG preview`);
    }
  }
});

test('library search, folder selection and size sorting work without mutating catalog', () => {
  const order = rows.map(row => row.id);
  assert.equal(filterPhotoLibrary(rows, 'heic').length, 24);
  const folder = rows[0].folder;
  assert.equal(filterPhotoLibrary(rows, '', folder).length, rows.filter(row => row.folder === folder).length);
  assert.equal(filterPhotoLibrary(rows, 'not-a-real-photo-name').length, 0);
  const sorted = filterPhotoLibrary(rows, '', '', 'size');
  for (let index = 1; index < sorted.length; index++) assert.ok(sorted[index - 1].bytes >= sorted[index].bytes);
  assert.deepEqual(rows.map(row => row.id), order);
});
