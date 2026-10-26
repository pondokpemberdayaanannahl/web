import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { photos, galleryImages, photoThumbnail } from '../src/data/photos.js';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('../src/data/photo-manifest.json', import.meta.url), 'utf8'));
function jpegSize(buffer) {
  assert.equal(buffer.readUInt16BE(0), 0xffd8);
  let offset = 2;
  while (offset < buffer.length - 8) {
    if (buffer[offset++] !== 0xff) continue;
    const marker = buffer[offset++];
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    offset += length;
  }
  throw Error('Missing JPEG dimensions');
}

test('all referenced optimized photos are valid JPEGs at the requested sizes', () => {
  let originals = 0, optimized = 0;
  for (const [relative, image] of Object.entries(manifest)) {
    originals += fs.statSync(new URL(`picture/${relative.split('/').map(encodeURIComponent).join('/')}`, root)).size;
    for (const [kind, edge] of [['full', 1600], ['thumbnail', 480]]) {
      const bytes = fs.readFileSync(new URL(`public${image[kind]}`, root));
      optimized += bytes.length;
      const { width, height } = jpegSize(bytes);
      assert.ok(Math.max(width, height) <= edge && Math.min(width, height) > 100, image[kind]);
    }
  }
  assert.ok(optimized < originals, 'Generated variants must reduce transfer size');
});

test('website photo references use optimized paths and gallery thumbnails exist', () => {
  const collect = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(collect);
  for (const url of [...collect(photos), ...galleryImages.map(row => row.src)]) {
    assert.match(url, /^\/media\/.+-1600\.jpg$/);
    assert.ok(fs.existsSync(new URL(`public${url}`, root)));
    assert.match(photoThumbnail(url), /-480\.jpg$/);
  }
});
