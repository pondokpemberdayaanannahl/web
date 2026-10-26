export function readAuthFlow(href) {
  try {
    const url = new URL(href);
    const hash = new URLSearchParams(url.hash.slice(1));
    const type = hash.get('type') || url.searchParams.get('type');
    const hasSession = hash.has('access_token') && hash.has('refresh_token');
    const kind = ['invite', 'recovery'].includes(type) && (hasSession || url.searchParams.has('code')) ? type : null;
    const error = hash.get('error_description') || url.searchParams.get('error_description') || '';
    return { kind, error: error.slice(0, 500) };
  } catch { return { kind: null, error: '' }; }
}

export function validateNewPassword(password, confirmation) {
  if (password.length < 10) return 'Gunakan password minimal 10 karakter.';
  if (password !== confirmation) return 'Konfirmasi password belum sama.';
  return '';
}
