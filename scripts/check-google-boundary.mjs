import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {PGlite}=await import(pathToFileURL(require.resolve('@electric-sql/pglite',{paths:[resolve('.backend-backups/sql-test-runtime')]})).href);
const db=new PGlite();
try {
  const original=readFileSync('supabase/migrations/202610260001_editorial.sql','utf8');
  const schema=original.slice(original.indexOf('create table if not exists public.form_submissions'),original.indexOf('create index if not exists form_submissions_kind_idx'));
  await db.exec(`create role anon; create role authenticated; ${schema}
    alter table public.form_submissions enable row level security;
    grant insert(id,kind,payload) on public.form_submissions to anon,authenticated;
    create policy public_submission on public.form_submissions for insert to anon,authenticated with check(status='baru');
    insert into public.form_submissions(kind,payload) values('donasi','{"nama":"Data lama uji","jumlah":"100"}');`);
  await db.exec(readFileSync('supabase/migrations/202610260002_google_forms_boundary.sql','utf8'));
  await db.exec(`set role anon; insert into public.form_submissions(kind,payload) values('kontak','{"nama":"Data uji","email":"uji@example.invalid","pesan":"Uji"}');`);
  for(const [kind,payload] of [['donasi',{nama:'Uji',jumlah:'100'}],['pendaftaran',{nama:'Uji',namaWali:'Wali',noWA:'000000000000'}]]) {
    await assert.rejects(db.query('insert into public.form_submissions(kind,payload) values($1,$2)',[kind,payload]),/row-level security/);
  }
  await db.exec('reset role');
  const result=await db.query('select kind,count(*)::int as count from public.form_submissions group by kind order by kind');
  assert.deepEqual(result.rows,[{kind:'donasi',count:1},{kind:'kontak',count:1}]);
  console.log('PASS (local PostgreSQL): contact insert allowed; registration/donation inserts denied; existing data preserved. No remote database contacted.');
} finally {await db.close();}
