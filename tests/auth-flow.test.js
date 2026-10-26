import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readAuthFlow, validateNewPassword } from '../src/auth-flow.js';

test('recognizes invitation/recovery sessions without exposing credentials', () => {
  const flow = readAuthFlow('http://localhost:5173/admin.html#access_token=fake-token&refresh_token=fake-refresh&type=invite');
  assert.deepEqual(flow, { kind: 'invite', error: '' });
  assert.ok(!JSON.stringify(flow).includes('fake-token'));
  assert.equal(readAuthFlow('https://example.org/#access_token=x&refresh_token=y&type=recovery').kind, 'recovery');
  assert.equal(readAuthFlow('https://example.org/#/program').kind, null);
  assert.equal(readAuthFlow('https://example.org/#type=invite').kind, null);
});

test('expired or invalid auth links expose only a bounded error description', () => {
  const result = readAuthFlow('https://example.org/#error=access_denied&error_description=Invitation%20expired');
  assert.equal(result.error, 'Invitation expired');
  assert.deepEqual(readAuthFlow(undefined), { kind: null, error: '' });
  assert.equal(readAuthFlow(`https://example.org/#error_description=${'a'.repeat(800)}`).error.length, 500);
});

test('new password validation supports long passphrases and rejects mismatches', () => {
  assert.match(validateNewPassword('short', 'short'), /10/);
  assert.match(validateNewPassword('a long passphrase', 'different'), /belum sama/);
  assert.equal(validateNewPassword('a long passphrase', 'a long passphrase'), '');
});

test('root entry sends untouched invite sessions to admin before loading public SDK', () => {
  const source = fs.readFileSync(new URL('../src/bootstrap.js', import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '').replace("import('./main.js')", 'startPublic()');
  let redirected = '', started = false;
  const location = { href: 'http://127.0.0.1:5173/#access_token=fake&refresh_token=fake&type=invite', hash: '#access_token=fake&refresh_token=fake&type=invite', search: '', replace(value) { redirected = value; } };
  vm.runInNewContext(source, { readAuthFlow, window: { location }, startPublic() { started = true; } });
  assert.equal(redirected, '/admin.html#access_token=fake&refresh_token=fake&type=invite');
  assert.equal(started, false);
});
