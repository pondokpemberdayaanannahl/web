export const demoEnabled = import.meta.env.DEV && import.meta.env.VITE_DUMMY_LOGIN_ENABLED === 'true';
export const demoUser = import.meta.env.VITE_DUMMY_USERNAME;
export const demoPassword = import.meta.env.VITE_DUMMY_PASSWORD;
export const backendConfigured = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'local-preview-only';
let clientPromise;
export const getClient = () => clientPromise ||= import('./supabase.js').then(module => module.supabase);

export async function authorizedUser(client, user) {
  const { data: profile, error } = await client.from('pengurus').select('display_name,role,active').eq('id', user.id).single();
  if (error || !profile?.active || !['admin', 'editor'].includes(profile.role)) {
    await client.auth.signOut();
    throw new Error('Akses pengurus belum aktif. Hubungi admin pondok.');
  }
  return { ...user, client, profile };
}

// Only a known page identifier is accepted; never a caller-supplied return URL.
export function dashboardPath(href = location.href) {
  const page = new URL(href).searchParams.get('page');
  return `/admin.html${['beranda','tentang','program','pendaftaran','donasi','kontak','berita','galeri','global'].includes(page) ? `?page=${encodeURIComponent(page)}` : ''}`;
}

export function loginPath({ preserveAuth = false, message = '' } = {}) {
  const url = new URL('/login.html', location.origin);
  const page = new URL(location.href).searchParams.get('page');
  if (page) url.searchParams.set('page', page);
  if (message) url.searchParams.set('message', message);
  if (preserveAuth) return `/login.html${location.search}${location.hash}`;
  return `${url.pathname}${url.search}`;
}
