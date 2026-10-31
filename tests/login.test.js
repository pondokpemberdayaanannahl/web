import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { readAuthFlow, validateNewPassword } from '../src/auth-flow.js';

const html = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/login.js', import.meta.url), 'utf8').replace(/^import .*;$/gm, '');
const shared = readFileSync(new URL('../src/admin-session.js', import.meta.url), 'utf8').replaceAll('export ', '').replaceAll('import.meta.env', 'env').replace("import('./supabase.js').then(module => module.supabase)", 'Promise.resolve(testClient)');
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture({ dev = true, backend = false, href = 'https://example.org/login.html?page=program', session = null, profile = null, loginUser = { id: 'pondok' }, loginError = '' } = {}) {
  const { document, window } = parseHTML(html);
  const saved = new Map(); let redirected = '', signedOut = 0; const logins = [];
  const context = { document, window, URL, readAuthFlow, validateNewPassword,
    async signInPengurus(client, username, password) { logins.push({ username, password }); if (loginError) throw new Error(loginError); return { user: loginUser }; },
    env: { DEV: dev, VITE_DUMMY_LOGIN_ENABLED: 'true', VITE_DUMMY_USERNAME: 'admin', VITE_DUMMY_PASSWORD: '123', VITE_SUPABASE_ANON_KEY: backend ? 'public-key-fixture' : 'local-preview-only' },
    location: { href, origin: 'https://example.org', search: new URL(href).search, hash: new URL(href).hash, replace(path) { redirected = path; } },
    sessionStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) },
    testClient: { auth: { getSession: async () => ({ data: { session } }), signOut: async () => { signedOut++; return {}; } }, from() { return { select() { return this; }, eq() { return this; }, single: async () => ({ data: profile }) }; } },
  };
  vm.runInNewContext(shared + '\n' + source, context);
  return { document, window, context, saved, logins, get redirected() { return redirected; }, get signedOut() { return signedOut; }, async submit() { document.getElementById('login-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); await tick(); } };
}

test('login is a separate HTML/controller and dummy access is restricted to development', async () => {
  assert.doesNotMatch(html, /id="dashboard-view"|src="\/src\/admin.js"/);
  for (const dev of [false, true]) {
    const ui = fixture({ dev });
    ui.document.getElementById('username').value = 'admin';
    ui.document.getElementById('password').value = '123';
    await ui.submit();
    if (dev) assert.equal(ui.redirected, '/admin.html?page=program');
    else { assert.equal(ui.redirected, ''); assert.match(ui.document.getElementById('login-error').textContent, /belum sesuai/); }
  }
});

test('production username login checks active membership before opening the dashboard', async () => {
  for (const active of [true, false]) {
    const ui = fixture({ dev: false, backend: true, profile: { role: 'admin', active } });
    await tick();
    ui.document.getElementById('username').value = ' admin.pondok ';
    ui.document.getElementById('password').value = ' unchanged password ';
    await ui.submit();
    assert.deepEqual(ui.logins, [{ username: 'admin.pondok', password: ' unchanged password ' }]);
    assert.equal(ui.redirected, active ? '/admin.html?page=program' : '');
    assert.equal(ui.signedOut, active ? 0 : 1);
  }
});

test('failed username login keeps the form usable and explains the failure', async () => {
  const ui = fixture({ dev: false, backend: true, loginError: 'Username atau password belum sesuai.' });
  await tick();
  ui.document.getElementById('username').value = 'admin.pondok';
  ui.document.getElementById('password').value = 'wrong-password';
  await ui.submit();
  assert.equal(ui.redirected, '');
  assert.match(ui.document.getElementById('login-error').textContent, /Username atau password/);
  assert.equal(ui.document.getElementById('login-btn').disabled, false);
});

test('invite/recovery remains on password setup until completed', async () => {
  const ui = fixture({ backend: true, href: 'https://example.org/login.html#access_token=fixture&refresh_token=fixture&type=invite', session: { user: { id: 'pondok', email: 'fixture@example.org' } } });
  await tick();
  assert.equal(ui.redirected, '');
  assert.equal(ui.document.getElementById('password-setup-view').hidden, false);
  assert.equal(ui.saved.get('annahl-password-setup'), 'pondok');
});

test('inactive accounts fail closed and return paths cannot point to another site', async () => {
  const ui = fixture({ backend: true, href: 'https://example.org/login.html?page=https://evil.example', session: { user: { id: 'inactive' } }, profile: { role: 'admin', active: false } });
  await tick();
  assert.equal(ui.signedOut, 1);
  assert.equal(ui.redirected, '');
  assert.equal(ui.context.dashboardPath('https://example.org/login.html?page=https://evil.example'), '/admin.html');
});
