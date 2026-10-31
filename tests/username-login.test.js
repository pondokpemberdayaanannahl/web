import test from 'node:test';
import assert from 'node:assert/strict';
import { signInPengurus } from '../src/username-login.js';

function client() {
  const calls = [];
  return { calls, auth: {
    async setSession(tokens) { calls.push(['session', tokens]); return { data: { user: { id: 'staff' } } }; },
    async signInWithPassword(input) { calls.push(['email', input]); return { data: { user: { id: 'legacy' } } }; },
  } };
}
const reply = (status, body) => ({ ok: status === 200, status, async json() { return body; } });

test('username credentials go only to the same-origin server, then establish the existing Auth session', async () => {
  const c = client(); const requests = [];
  const result = await signInPengurus(c, ' Admin.Pondok ', ' original password ', { fetcher: async (url, options) => {
    requests.push({ url, options }); return reply(200, { ok: true, access_token: 'access-fixture', refresh_token: 'refresh-fixture' });
  } });
  assert.equal(result.user.id, 'staff');
  assert.equal(requests[0].url, '/api/login.php');
  const options = requests[0].options;
  assert.equal(options.method, 'POST'); assert.equal(options.mode, 'same-origin'); assert.equal(options.cache, 'no-store');
  assert.equal(options.headers['X-Annahl-Login'], '1');
  assert.deepEqual(JSON.parse(options.body), { username: 'admin.pondok', password: ' original password ' });
  assert.deepEqual(c.calls, [['session', { access_token: 'access-fixture', refresh_token: 'refresh-fixture' }]]);
});

test('existing email accounts still sign in without requiring the username server', async () => {
  const c = client();
  const result = await signInPengurus(c, ' legacy@example.org ', 'password', { fetcher: async () => assert.fail('Email must not use alias lookup') });
  assert.equal(result.user.id, 'legacy');
  assert.deepEqual(c.calls, [['email', { email: 'legacy@example.org', password: 'password' }]]);
});

test('failed, unconfigured, throttled, malformed and interrupted responses never establish a session or expose server details', async () => {
  for (const [status, message] of [[401, /Username atau password/], [429, /Terlalu banyak/], [503, /Gunakan email/]]) {
    const c = client();
    await assert.rejects(signInPengurus(c, 'admin', 'bad', { fetcher: async () => reply(status, { message: 'PRIVATE_EMAIL_OR_DIAGNOSTIC' }) }), message);
    assert.equal(c.calls.length, 0);
  }
  for (const body of [null, {}, { ok: true }, { ok: true, access_token: [], refresh_token: 'x' }]) {
    const c = client();
    await assert.rejects(signInPengurus(c, 'admin', 'bad', { fetcher: async () => reply(200, body) }), /Respons login/);
    assert.equal(c.calls.length, 0);
  }
  await assert.rejects(signInPengurus(client(), 'admin', 'bad', { fetcher: async () => { throw new Error('private upstream address'); } }), /Sambungan login/);
});

test('invalid usernames do not make network requests and failed session storage never counts as login success', async () => {
  for (const username of ['ab', 'a'.repeat(33), 'admin pondok', 'éadmin', '../admin']) {
    await assert.rejects(signInPengurus(client(), username, 'bad', { fetcher: async () => assert.fail('Invalid username sent') }), /3–32/);
  }
  const c = client(); c.auth.setSession = async () => ({ data: null, error: new Error('bad tokens') });
  await assert.rejects(signInPengurus(c, 'admin', 'password', { fetcher: async () => reply(200, { ok: true, access_token: 'bad', refresh_token: 'bad' }) }), /Sesi login/);
});
