import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from '../node_modules/vite/dist/node/index.js';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
process.env.VITE_SUPABASE_URL = 'https://abcdefghijklmnopqrst.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'public-fixture';
process.env.VITE_DUMMY_LOGIN_ENABLED = 'false';
process.env.VITE_GOOGLE_PICKER_CLIENT_ID = '123-fixture.apps.googleusercontent.com';
process.env.VITE_GOOGLE_PICKER_API_KEY = 'AIzaFixturePickerKey';
process.env.VITE_GOOGLE_PICKER_APP_ID = '123';
await mkdir('tmp/native-picker', { recursive: true });
const vite = await createServer({ configFile: 'vite.config.js', logLevel: 'silent', server: { host: '127.0.0.1', port: 0, open: false } });
await vite.listen();
const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
let step = 'setup';
const results = [];
try {
  const png = await readFile('public/brand/an-nahl.png');
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.gapi = { load: (name, options) => options.callback() };
      class View {
        setMode() { return this; } setIncludeFolders() { return this; }
        setSelectFolderEnabled() { return this; } setMimeTypes() { return this; }
      }
      class Builder {
        setAppId() { return this; } setDeveloperKey() { return this; }
        setOAuthToken() { return this; } setOrigin() { return this; }
        setLocale() { return this; } setTitle() { return this; }
        setSize() { return this; } addView() { return this; }
        setCallback(callback) { this.callback = callback; return this; }
        build() {
          const callback = this.callback;
          return {
            setVisible() {
              const element = document.createElement('div');
              element.id = 'mock-google-picker';
              element.style = 'position:fixed;inset:10px;background:white;z-index:999999;padding:25px';
              element.innerHTML = '<button id="mock-cancel">Batal fixture</button><button id="mock-pick">Pilih fixture</button>';
              element.querySelector('#mock-cancel').onclick = () => callback({ action: 'cancel' });
              element.querySelector('#mock-pick').onclick = () => callback({ action: 'picked', docs: [{ id: window.nextGooglePhoto || 'native-library-photo-12345' }] });
              document.body.append(element);
            },
            dispose() { document.querySelector('#mock-google-picker')?.remove(); },
          };
        }
      }
      window.google = {
        picker: { DocsView: View, PickerBuilder: Builder, ViewId: { DOCS_IMAGES: 'images' }, DocsViewMode: { GRID: 'grid' }, Action: { CANCEL: 'cancel', PICKED: 'picked' } },
        accounts: { oauth2: {
          initTokenClient(options) { return { requestAccessToken() { options.callback({ access_token: 'google-user-token-fixture', expires_in: 3600 }); } }; },
          hasGrantedAllScopes() { return true; },
        } },
      };
    });
    const user = { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.invalid', aud: 'authenticated', role: 'authenticated', user_metadata: {}, app_metadata: {} };
    const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const token = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: user.id, exp: Math.floor(Date.now()/1000)+3600, aud: 'authenticated' }) + '.fixture';
    await page.route('https://abcdefghijklmnopqrst.supabase.co/**', async route => {
      const path = new URL(route.request().url()).pathname;
      const data = path.includes('/auth/v1/token') ? { access_token: token, refresh_token: 'fixture-refresh', expires_in: 3600, token_type: 'bearer', user }
        : path.includes('/auth/v1/user') ? user
        : path.includes('/rest/v1/pengurus') ? { display_name: 'Admin fixture', role: 'admin', active: true } : [];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    let uploads = 0, resolutions = 0, googleReads = 0;
    const photo = { id: 'known-photo', full: '/brand/an-nahl.png', thumbnail: '/brand/an-nahl.png', filename: 'Foto fixture', complete: true };
    await page.route('**/api/media.php*', async route => {
      const request = route.request(), url = new URL(request.url());
      let data;
      if (request.method() === 'POST') {
        uploads++;
        const body = request.postDataJSON();
        if (request.postData().includes('google-user-token-fixture')) errors.push('Google token sent to hosting');
        data = { ok: true, variant: 'full', sha256: body.file.sha256, asset: { ...photo, id: body.assetId } };
      } else if (url.searchParams.get('action') === 'resolve') {
        resolutions++;
        data = { ok: true, asset: url.searchParams.get('fileId') === 'native-library-photo-12345' ? photo : null };
      } else data = { ok: true, photos: [], cursor: '' };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,OPTIONS' };
    await page.route('https://www.googleapis.com/drive/v3/files/**', async route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      googleReads++;
      if (request.headers().authorization !== 'Bearer google-user-token-fixture') errors.push('Incorrect Google authorization');
      await route.fulfill({ status: 200, headers: cors, contentType: url.searchParams.has('fields') ? 'application/json' : 'image/png', body: url.searchParams.has('fields') ? JSON.stringify({ id: 'external-google-photo-12345', name: 'foto.png', mimeType: 'image/png', size: String(png.length) }) : png });
    });
    step = `${width} login`;
    await page.goto(origin + '/login.html');
    await page.locator('#username').fill(user.email);
    await page.locator('#password').fill('fixture-password');
    await page.locator('#login-btn').click();
    await page.waitForURL('**/admin.html');
    step = `${width} editor`;
    await page.locator('[data-panel="berita"]').click();
    await page.locator('[data-action="new-extracurricular"]').click();
    await page.locator('#judul').fill('Judul tetap tersedia');
    await page.locator('#isi').fill('Caption kegiatan santri tetap tersedia.');
    await page.locator('#gambar').setInputFiles('public/brand/an-nahl.png');
    await page.locator('#editor-message').filter({ hasText: 'Foto siap dipakai.' }).waitFor();
    const localImage = await page.locator('#image-preview').getAttribute('src');
    step = `${width} cancel native popup`;
    await page.locator('#drive-pick').click();
    await page.locator('[data-google-open]').click();
    await page.locator('#mock-google-picker').waitFor();
    assert.equal(await page.locator('#editor-dialog').getAttribute('open'), null);
    await page.locator('#mock-cancel').click();
    await page.locator('#editor-dialog[open]').waitFor();
    assert.equal(await page.locator('#judul').inputValue(), 'Judul tetap tersedia');
    assert.equal(await page.locator('#isi').inputValue(), 'Caption kegiatan santri tetap tersedia.');
    assert.equal(await page.locator('#image-preview').getAttribute('src'), localImage);
    step = `${width} existing library photo`;
    await page.locator('#drive-pick').click();
    await page.locator('#mock-pick').click();
    await page.locator('.google-drive-connect').waitFor({ state: 'hidden' });
    await page.locator('#editor-message').filter({ hasText: 'Foto Drive dipilih:' }).waitFor();
    assert.equal(uploads, 0);
    assert.equal(resolutions, 1);
    assert.match(await page.locator('#image-preview').getAttribute('src'), /brand\/an-nahl.png/);
    step = `${width} external Google photo`;
    await page.evaluate(() => { window.nextGooglePhoto = 'external-google-photo-12345'; });
    await page.locator('#drive-pick').click();
    await page.locator('#mock-pick').click();
    await page.locator('.google-drive-connect').waitFor({ state: 'hidden' });
    await page.locator('#editor-message').filter({ hasText: 'Foto Drive dipilih:' }).waitFor();
    assert.equal(uploads, 1);
    assert.equal(googleReads, 2);
    assert.equal(await page.locator('#judul').inputValue(), 'Judul tetap tersedia');
    assert.equal(await page.locator('#isi').inputValue(), 'Caption kegiatan santri tetap tersedia.');
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `tmp/native-picker/editor-${width}.png` });
    results.push({ width, preservedDraftOnCancel: true, reusedLibraryPhoto: true, importedExternalPhoto: true, uploads, googleReads, pageErrors: errors });
    await context.close();
  }
  await writeFile('tmp/native-picker/results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ ok: true, results }));
} catch (error) {
  console.log(JSON.stringify({ ok: false, step, error: error.message.slice(0, 1500) }));
  process.exitCode = 1;
} finally { await browser.close(); await vite.close(); }
