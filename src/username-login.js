const invalidCredentials = 'Username atau password belum sesuai. Silakan coba lagi.';

export async function signInPengurus(client, identifier, password, { fetcher = fetch } = {}) {
  const account = identifier.trim();
  // Keep existing accounts usable while usernames are assigned on the server.
  if (account.includes('@')) {
    const result = await client.auth.signInWithPassword({ email: account, password });
    if (result.error) throw new Error(result.error.status === 400 ? invalidCredentials : 'Tidak dapat terhubung. Silakan coba lagi.');
    return result.data;
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/i.test(account)) throw new Error('Username harus 3–32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.');
  let response, result;
  try {
    response = await fetcher('/api/login.php', {
      method: 'POST', mode: 'same-origin', credentials: 'omit', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Annahl-Login': '1' },
      body: JSON.stringify({ username: account.toLowerCase(), password }),
      signal: AbortSignal.timeout(30000),
    });
    result = await response.json();
  } catch { throw new Error('Sambungan login belum berhasil. Periksa koneksi lalu coba lagi.'); }
  if (!response.ok) {
    if (response.status === 401) throw new Error(invalidCredentials);
    if (response.status === 429) throw new Error('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.');
    throw new Error('Login username belum tersedia. Gunakan email akun atau hubungi pengelola.');
  }
  if (result?.ok !== true || typeof result.access_token !== 'string' || !result.access_token || typeof result.refresh_token !== 'string' || !result.refresh_token) {
    throw new Error('Respons login belum sesuai. Silakan coba lagi.');
  }
  const { data, error } = await client.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
  if (error || !data?.user) throw new Error('Sesi login belum dapat disimpan. Silakan coba lagi.');
  return data;
}
