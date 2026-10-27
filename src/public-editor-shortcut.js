import { SITE_PAGES } from './site-content.js';

export async function initEditorShortcut(client) {
  if (!client) return;
  let sequence = 0;
  async function refresh() {
    const request = ++sequence;
    try {
      const { data } = await client.auth.getSession();
      if (request !== sequence) return;
      if (!data.session) { document.getElementById('site-editor-shortcut')?.remove(); return; }
      const { data: profile, error } = await client.from('pengurus').select('role,active').eq('id', data.session.user.id).maybeSingle();
      if (request !== sequence) return;
      if (error || !profile?.active || profile.role !== 'admin') { document.getElementById('site-editor-shortcut')?.remove(); return; }
      let link = document.getElementById('site-editor-shortcut');
      if (!link) { link = document.createElement('a'); link.id = 'site-editor-shortcut'; link.className = 'site-editor-shortcut'; link.textContent = '✎ Edit halaman ini'; document.body.append(link); }
      const path = location.hash.slice(1).split('?')[0] || '/';
      const page = SITE_PAGES.find(item => item.id !== 'global' && item.path === path);
      link.href = `/admin.html?page=${encodeURIComponent(page?.id || 'beranda')}`;
    } catch { if (request === sequence) document.getElementById('site-editor-shortcut')?.remove(); }
  }
  window.addEventListener('hashchange', refresh);
  window.addEventListener('pageshow', refresh);
  client.auth.onAuthStateChange(() => { setTimeout(refresh, 0); });
  await refresh();
}
