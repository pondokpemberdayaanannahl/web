import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { photos } from '../src/data/photos.js';
import { initDonationPayment } from '../src/donation-payment.js';
import { categoryCards } from '../src/components/category-cards.js';

function fixture() {
  const source = readFileSync(new URL('../src/pages/donasi.js', import.meta.url), 'utf8').replace(/^import .*;$/gm, '').replace('export function', 'function');
  const context = { photos, window: {} };
  vm.runInNewContext(source, context);
  const { document, window } = parseHTML(`<html><body>${context.Donasi()}</body></html>`);
  // LinkeDOM omits the native HTMLSelectElement value setter.
  for (const select of document.querySelectorAll('select')) Object.defineProperty(select, 'value', { writable: true, value: '' });
  const dialog = document.getElementById('payment-dialog');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  initDonationPayment(document);
  return { document, dialog, click(selector) { document.querySelector(selector).dispatchEvent(new window.Event('click', { bubbles: true })); } };
}

test('program choice opens payment details, keeps unique IDs, and prefills confirmation', () => {
  const ui = fixture();
  ui.click('[data-donate-program="Pembangunan Fasilitas"]');
  assert.equal(ui.dialog.open, true);
  assert.equal(ui.document.getElementById('donor-program').value, 'Pembangunan Fasilitas');
  assert.equal(ui.document.getElementById('payment-program').textContent, 'Pembangunan Fasilitas');
  ui.click('[data-payment-method="qris"]');
  assert.equal(ui.document.getElementById('donor-method').value, 'QRIS');
  assert.equal(ui.document.getElementById('donation-qris').hidden, true);
  assert.equal(ui.document.getElementById('qris-unavailable').hidden, false);
  const ids = [...ui.document.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length);
  ui.click('#payment-close');
  assert.equal(ui.dialog.open, false);
  assert.doesNotMatch(ui.document.body.innerHTML, /Unduh Laporan|Laporan Donasi Terbuka/);
});

test('published QRIS image is displayed while missing QRIS is not replaced with a fabricated code', () => {
  const ui = fixture();
  ui.document.getElementById('donation-qris').setAttribute('src', 'https://example.org/official-qris.png');
  ui.click('[data-open-payment="qris"]');
  assert.equal(ui.document.getElementById('donation-qris').hidden, false);
  assert.equal(ui.document.getElementById('qris-unavailable').hidden, true);
});

test('each news and gallery category has an optimized local image and accessible selection state', () => {
  for (const kind of ['news', 'gallery']) {
    const { document } = parseHTML(categoryCards(kind));
    assert.equal(document.querySelectorAll('.category-card img').length, 4);
    assert.equal(document.querySelectorAll('[aria-pressed="true"]').length, 1);
    for (const image of document.querySelectorAll('img')) assert.match(image.getAttribute('src'), /\/media\/.*-480\.jpg$/);
  }
});
