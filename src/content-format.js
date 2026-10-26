export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function safeUrl(value) {
  if (typeof value !== 'string' || !value) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { return ['https:', 'http:', 'blob:'].includes(new URL(value).protocol) ? value : ''; } catch { return ''; }
}

function inline(text) {
  // Parse the limited markup before escaping; user-provided HTML is always text.
  const tokens = /(\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(([^\s)]+)\))/g;
  let result = '', offset = 0;
  for (const match of text.matchAll(tokens)) {
    result += escapeHtml(text.slice(offset, match.index));
    if (match[2]) result += `<strong>${escapeHtml(match[2])}</strong>`;
    else {
      const url = safeUrl(match[4]);
      result += url && !url.startsWith('blob:') ? `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(match[3])}</a>` : escapeHtml(match[0]);
    }
    offset = match.index + match[0].length;
  }
  return result + escapeHtml(text.slice(offset));
}

export function renderBody(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').split(/\n\s*\n/).filter(block => block.trim()).map(block => {
    const lines = block.trim().split('\n');
    if (lines.every(line => /^-\s+/.test(line))) return `<ul>${lines.map(line => `<li>${inline(line.replace(/^-\s+/, ''))}</li>`).join('')}</ul>`;
    return lines.map(line => /^##\s+/.test(line) ? `<h3>${inline(line.replace(/^##\s+/, ''))}</h3>` : `<p>${inline(line)}</p>`).join('');
  }).join('');
}

export function plainText(value) {
  return String(value ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').replace(/^\s*(?:##\s+|-\s+)/gm, '').replace(/\s+/g, ' ').trim();
}
