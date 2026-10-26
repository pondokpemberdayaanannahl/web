export const LIBRARY_PAGE_SIZE = 24;
let pending;

export async function loadPhotoLibrary() {
  pending ||= fetch(new URL('./data/photo-library.json', import.meta.url)).then(async response => {
    if (!response.ok) throw new Error('Katalog foto belum dapat dimuat.');
    const body = await response.json();
    if (!Array.isArray(body.photos)) throw new Error('Katalog foto tidak valid.');
    return body.photos;
  }).catch(error => { pending = null; throw error; });
  return pending;
}

export function filterPhotoLibrary(rows, search = '', folder = '', sort = 'folder') {
  const query = search.trim().toLocaleLowerCase('id');
  return rows.filter(row => (!folder || row.folder === folder) && (!query || `${row.filename} ${row.folder} ${row.format}`.toLocaleLowerCase('id').includes(query))).sort((a, b) => {
    if (sort === 'size') return b.bytes - a.bytes || a.path.localeCompare(b.path);
    const left = sort === 'name' ? a.filename : `${a.folder} ${a.filename}`;
    const right = sort === 'name' ? b.filename : `${b.folder} ${b.filename}`;
    return left.localeCompare(right, 'id', { numeric: true });
  });
}
