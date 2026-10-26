// Optional real PostgreSQL test engine, kept outside application dependencies and default test discovery.
// npm install --prefix .backend-backups/sql-test-runtime --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { PGlite } = await import(pathToFileURL(require.resolve('@electric-sql/pglite', { paths: [resolve('.backend-backups/sql-test-runtime')] })).href);
const db = new PGlite();
try {
  // Use the actual submission schema rather than a hand-maintained table copy.
  const editorial = readFileSync(new URL('../supabase/migrations/202610260001_editorial.sql', import.meta.url), 'utf8');
  const table = editorial.slice(editorial.indexOf('create table if not exists public.form_submissions'), editorial.indexOf('create index if not exists form_submissions_kind_idx'));
  await db.exec(`create role anon; create role authenticated;
    create schema private; revoke all on schema private from public; grant usage on schema private to anon, authenticated;
    ${table}
    alter table public.form_submissions enable row level security;
    grant insert(id,kind,payload) on public.form_submissions to anon,authenticated;
    create policy public_submission on public.form_submissions for insert to anon,authenticated with check(status='baru');`);
  await db.exec(readFileSync(new URL('../integrations/google-sheets/legacy/202610260002_sheets_sync.sql', import.meta.url), 'utf8'));
  const results = await db.exec(readFileSync(new URL('../supabase/tests/sheets_sync.sql', import.meta.url), 'utf8'));
  const passed = results.flatMap(result => result.rows || []).find(row => row.result === 'PASS');
  if (!passed) throw new Error('SQL checks did not return PASS');
  console.log(`PASS (local PostgreSQL): ${passed.verified}`);
  const state = await db.query('select (select count(*) from public.form_submissions)::int as fixtures, enabled from private.sheets_sync_settings where singleton');
  if (state.rows[0].fixtures !== 0 || state.rows[0].enabled !== false) throw new Error('Fixture rollback failed');
  console.log('All fixtures rolled back; integration remains disabled. No remote database was contacted.');
} finally { await db.close(); }
