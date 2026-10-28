import { readAuthFlow, validateNewPassword } from './auth-flow.js';
import { demoEnabled, demoUser, demoPassword, backendConfigured, getClient, authorizedUser, dashboardPath } from './admin-session.js';
const $ = id => document.getElementById(id);
const incomingAuth = readAuthFlow(location.href);
let passwordSetupClient = null, passwordSetupUser = null;
const goDashboard = () => location.replace(dashboardPath());
const toast = message => { $('login-error').textContent = message; };
if (new URL(location.href).searchParams.has('message')) $('login-error').textContent = 'Sesi berakhir atau akses belum tersedia. Silakan masuk kembali.';
$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('login-btn');
  button.disabled = true;
  button.textContent = 'Memeriksa akun…';
  $('login-error').textContent = '';
  try {
    const username = $('email').value.trim(), password = $('password').value;
    if (demoEnabled && demoUser && demoPassword && username === demoUser && password === demoPassword) {
      sessionStorage.setItem('annahl-dummy-user', demoUser);
      goDashboard();
    } else if (!backendConfigured || (demoEnabled && username === demoUser)) {
      throw new Error('Akun atau password belum sesuai. Silakan coba lagi.');
    } else {
      const client = await getClient();
      const { data, error } = await client.auth.signInWithPassword({ email: username, password });
      if (error) throw new Error(error.status === 400 ? 'Email atau password salah.' : 'Tidak dapat terhubung. Silakan coba lagi.');
      sessionStorage.removeItem('annahl-dummy-user');
      await authorizedUser(client, data.user); goDashboard();
    }
  } catch (error) { $('login-error').textContent = error.message; }
  finally { button.disabled = false; button.textContent = 'Masuk ke ruang pengurus →'; }
});
$('password-toggle').addEventListener('click', () => {
  const show = $('password').type === 'password';
  $('password').type = show ? 'text' : 'password';
  $('password-toggle').textContent = show ? 'Sembunyi' : 'Lihat';
  $('password-toggle').setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
  $('password-toggle').setAttribute('aria-pressed', String(show));
});
async function restoreSession() {
  try {
    if (incomingAuth.error) { $('login-error').textContent = 'Tautan aktivasi tidak valid atau sudah kedaluwarsa. Minta undangan baru kepada admin proyek.'; return; }
    if (!incomingAuth.kind && demoEnabled && demoUser && sessionStorage.getItem('annahl-dummy-user') === demoUser) { goDashboard(); return; }
    if (!backendConfigured) return;
    const client = await getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session) {
      if (incomingAuth.kind || sessionStorage.getItem('annahl-password-setup') === data.session.user.id) showPasswordSetup(client, data.session.user);
      else { await authorizedUser(client, data.session.user); goDashboard(); }
    } else if (incomingAuth.kind) $('login-error').textContent = 'Tautan aktivasi tidak dapat dipakai. Buka tautan terbaru dari email undangan.';
  } catch { $('login-error').textContent = 'Sesi belum dapat dipulihkan. Silakan masuk kembali.'; }
}
function showPasswordSetup(client, user) {
  passwordSetupClient = client; passwordSetupUser = user;
  sessionStorage.setItem('annahl-password-setup', user.id);
  sessionStorage.removeItem('annahl-dummy-user');
  $('login-view').hidden = true;
  $('password-setup-view').hidden = false;
  $('setup-account-email').textContent = user.email;
  $('setup-password').focus();
  document.title = 'Aktivasi akun — Ruang Pengurus An-Nahl';
}
$('password-setup-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!passwordSetupClient || $('setup-save').disabled) return;
  const password = $('setup-password').value;
  const message = validateNewPassword(password, $('setup-password-confirm').value);
  $('setup-error').textContent = message;
  if (message) return;
  $('setup-save').disabled = $('setup-cancel').disabled = true;
  $('setup-save').textContent = 'Mengaktifkan akun…';
  try {
    const { error } = await passwordSetupClient.auth.updateUser({ password });
    if (error) throw new Error('Password belum dapat disimpan. Coba password lain atau minta tautan aktivasi baru.');
    sessionStorage.removeItem('annahl-password-setup');
    $('password-setup-form').reset();
    await authorizedUser(passwordSetupClient, passwordSetupUser); goDashboard();
    toast('Akun aktif. Selamat datang di ruang pengurus.');
    passwordSetupClient = null; passwordSetupUser = null;
  } catch (error) { $('setup-error').textContent = error.message; }
  finally { $('setup-save').disabled = $('setup-cancel').disabled = false; $('setup-save').textContent = 'Aktifkan akun'; }
});
$('setup-cancel').addEventListener('click', async () => {
  if (!passwordSetupClient) return;
  $('setup-cancel').disabled = true;
  try {
    const { error } = await passwordSetupClient.auth.signOut();
    if (error) throw error;
    passwordSetupClient = null; passwordSetupUser = null;
    $('password-setup-form').reset();
    $('password-setup-view').hidden = true; $('login-view').hidden = false;
  } catch { $('setup-error').textContent = 'Belum berhasil keluar. Silakan coba lagi.'; }
  finally { $('setup-cancel').disabled = false; }
});

restoreSession();
