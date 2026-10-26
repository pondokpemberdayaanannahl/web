-- Review and apply in a staging Supabase project first. This is not run by the website.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon,authenticated;

create table if not exists public.pengurus (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Pengurus',
  role text not null check (role in ('admin','editor')),
  active boolean not null default true
);
create or replace function private.pengurus_role() returns text
language sql stable security definer set search_path = ''
as $$ select role from public.pengurus where id = (select auth.uid()) and active $$;
revoke all on function private.pengurus_role() from public;
grant execute on function private.pengurus_role() to anon,authenticated;

create table if not exists public.berita (
  id uuid primary key default gen_random_uuid(), judul text not null, kategori text not null,
  isi text not null, gambar_url text, dibuat_pada timestamptz not null default now()
);
alter table public.berita add column if not exists status text not null default 'published';
alter table public.berita alter column status set default 'draft';
alter table public.berita add column if not exists deleted_at timestamptz;
alter table public.berita add column if not exists updated_at timestamptz not null default now();
alter table public.berita add column if not exists author_id uuid references auth.users(id);
alter table public.berita add column if not exists updated_by uuid references auth.users(id);
alter table public.berita add column if not exists thumbnail_url text;
alter table public.berita add column if not exists caption text not null default '';
alter table public.berita drop constraint if exists berita_editorial_status;
alter table public.berita add constraint berita_editorial_status check(status in ('draft','published'));
create index if not exists berita_public_idx on public.berita(dibuat_pada desc) where deleted_at is null and status = 'published';
create index if not exists berita_author_idx on public.berita(author_id);

create table if not exists public.galeri_foto (
  id uuid primary key default gen_random_uuid(), judul text not null, kategori text not null,
  gambar_url text not null, dibuat_pada timestamptz not null default now()
);
alter table public.galeri_foto add column if not exists thumbnail_url text;
alter table public.galeri_foto add column if not exists caption text not null default '';
create table if not exists public.galeri_video (
  id uuid primary key default gen_random_uuid(), judul text not null, kategori text not null,
  youtube_id text not null, dibuat_pada timestamptz not null default now()
);
create table if not exists public.berita_history (
  id bigint generated always as identity primary key, news_id text not null,
  action text not null, actor_id uuid, actor_name text not null,
  dibuat_pada timestamptz not null default now(), snapshot jsonb not null
);
create index if not exists berita_history_news_idx on public.berita_history(news_id, dibuat_pada desc);

create or replace function private.guard_berita() returns trigger
language plpgsql set search_path = '' as $$
declare actor uuid := auth.uid(); member_role text;
begin
  if actor is not null then
    member_role := private.pengurus_role();
    if member_role is null then raise exception 'Akses pengurus belum aktif'; end if;
    if tg_op = 'INSERT' then
      new.author_id := actor;
      if member_role <> 'admin' and (new.status <> 'draft' or new.deleted_at is not null) then raise exception 'Penulis hanya dapat menyimpan draft'; end if;
    else
      if member_role <> 'admin' and (old.author_id is distinct from actor or old.status <> 'draft' or old.deleted_at is not null or new.status <> 'draft' or new.deleted_at is not null) then raise exception 'Perubahan memerlukan admin'; end if;
      new.author_id := old.author_id;
    end if;
    new.updated_by := actor;
  end if;
  if tg_op = 'UPDATE' then new.dibuat_pada := old.dibuat_pada; end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function private.guard_berita() from public;
drop trigger if exists guard_berita on public.berita;
create trigger guard_berita before insert or update on public.berita for each row execute function private.guard_berita();

create or replace function private.log_berita() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor_name text; operation text;
begin
  select display_name into actor_name from public.pengurus where id = auth.uid();
  operation := case when tg_op = 'INSERT' then 'create' when old.deleted_at is null and new.deleted_at is not null then 'archive' when old.deleted_at is not null and new.deleted_at is null then 'restore' else 'update' end;
  insert into public.berita_history(news_id, action, actor_id, actor_name, snapshot)
  values(new.id::text, operation, auth.uid(), coalesce(actor_name,'Admin proyek'), to_jsonb(new));
  return new;
end $$;
revoke all on function private.log_berita() from public;
drop trigger if exists log_berita on public.berita;
create trigger log_berita after insert or update on public.berita for each row execute function private.log_berita();
-- Keep one baseline version of existing articles before future changes.
insert into public.berita_history(news_id,action,actor_name,snapshot)
select b.id::text,'baseline','Migrasi proyek',to_jsonb(b) from public.berita b
where not exists(select 1 from public.berita_history h where h.news_id=b.id::text);

create or replace function private.guard_pengurus() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and old.id=auth.uid() and (new.role <> old.role or new.active <> old.active) then raise exception 'Tidak dapat mengubah akses akun sendiri'; end if;
  return new;
end $$;
revoke all on function private.guard_pengurus() from public;
drop trigger if exists guard_pengurus on public.pengurus;
create trigger guard_pengurus before update on public.pengurus for each row execute function private.guard_pengurus();

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('pendaftaran','kontak','donasi')),
  payload jsonb not null, status text not null default 'baru' check(status in ('baru','diproses','selesai')),
  dibuat_pada timestamptz not null default now(),
  constraint submission_size check(octet_length(payload::text) <= 16000),
  constraint submission_required check(jsonb_typeof(payload)='object' and length(trim(coalesce(payload->>'nama',''))) between 2 and 180
    and (kind <> 'pendaftaran' or (length(trim(coalesce(payload->>'noWA',''))) between 8 and 24 and length(trim(coalesce(payload->>'namaWali',''))) > 1))
    and (kind <> 'kontak' or (length(trim(coalesce(payload->>'email',''))) > 3 and length(trim(coalesce(payload->>'pesan',''))) > 0))
    and (kind <> 'donasi' or length(trim(coalesce(payload->>'jumlah',''))) > 0))
);
create index if not exists form_submissions_kind_idx on public.form_submissions(kind,dibuat_pada desc);

-- Replace prior permissive policies on these application tables, not other tables.
do $$ declare item record; begin
  for item in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('pengurus','berita','berita_history','galeri_foto','galeri_video','form_submissions') loop
    execute format('drop policy %I on public.%I', item.policyname,item.tablename);
  end loop;
end $$;
alter table public.pengurus enable row level security;
alter table public.berita enable row level security;
alter table public.berita_history enable row level security;
alter table public.galeri_foto enable row level security;
alter table public.galeri_video enable row level security;
alter table public.form_submissions enable row level security;
revoke all on public.pengurus,public.berita,public.berita_history,public.galeri_foto,public.galeri_video,public.form_submissions from anon,authenticated;
grant select on public.berita,public.galeri_foto,public.galeri_video to anon,authenticated;
grant select on public.pengurus,public.berita_history,public.form_submissions to authenticated;
grant insert,update on public.berita to authenticated;
grant update(role,active,display_name) on public.pengurus to authenticated;
grant insert,update,delete on public.galeri_foto,public.galeri_video to authenticated;
grant insert(id,kind,payload) on public.form_submissions to anon,authenticated;
grant update(status) on public.form_submissions to authenticated;

create policy published_news on public.berita for select to anon,authenticated using(status='published' and deleted_at is null);
create policy staff_news on public.berita for select to authenticated using((select private.pengurus_role())='admin' or ((select private.pengurus_role())='editor' and author_id=(select auth.uid())));
create policy staff_news_insert on public.berita for insert to authenticated with check((select private.pengurus_role()) in ('admin','editor') and author_id=(select auth.uid()) and ((select private.pengurus_role())='admin' or (status='draft' and deleted_at is null)));
create policy staff_news_update on public.berita for update to authenticated using((select private.pengurus_role())='admin' or ((select private.pengurus_role())='editor' and author_id=(select auth.uid()) and status='draft' and deleted_at is null)) with check((select private.pengurus_role())='admin' or ((select private.pengurus_role())='editor' and author_id=(select auth.uid()) and status='draft' and deleted_at is null));
create policy staff_profile_read on public.pengurus for select to authenticated using(id=(select auth.uid()) or (select private.pengurus_role())='admin');
create policy admin_profile_update on public.pengurus for update to authenticated using((select private.pengurus_role())='admin') with check((select private.pengurus_role())='admin');
create policy staff_history_read on public.berita_history for select to authenticated using((select private.pengurus_role())='admin' or ((select private.pengurus_role())='editor' and exists(select 1 from public.berita b where b.id::text=news_id and b.author_id=(select auth.uid()))));
create policy public_photos on public.galeri_foto for select to anon,authenticated using(true);
create policy public_videos on public.galeri_video for select to anon,authenticated using(true);
create policy admin_photos on public.galeri_foto for all to authenticated using((select private.pengurus_role())='admin') with check((select private.pengurus_role())='admin');
create policy admin_videos on public.galeri_video for all to authenticated using((select private.pengurus_role())='admin') with check((select private.pengurus_role())='admin');
create policy public_submission on public.form_submissions for insert to anon,authenticated with check(status='baru');
create policy admin_submission_read on public.form_submissions for select to authenticated using((select private.pengurus_role())='admin');
create policy admin_submission_update on public.form_submissions for update to authenticated using((select private.pengurus_role())='admin') with check((select private.pengurus_role())='admin');

-- Public image buckets. Draft text is private; cover URLs are public, so do not upload confidential photos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('berita-gambar','berita-gambar',true,2097152,array['image/jpeg','image/png','image/webp','image/gif']),('galeri-foto','galeri-foto',true,2097152,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- Restrictive policies also constrain any older permissive policies on these buckets.
drop policy if exists annahl_upload_guard on storage.objects;
create policy annahl_upload_guard on storage.objects as restrictive for insert to anon,authenticated with check(bucket_id not in ('berita-gambar','galeri-foto') or ((select private.pengurus_role())='admin' or (bucket_id='berita-gambar' and (select private.pengurus_role())='editor')));
drop policy if exists annahl_update_guard on storage.objects;
create policy annahl_update_guard on storage.objects as restrictive for update to anon,authenticated using(bucket_id not in ('berita-gambar','galeri-foto')) with check(bucket_id not in ('berita-gambar','galeri-foto'));
drop policy if exists annahl_delete_guard on storage.objects;
create policy annahl_delete_guard on storage.objects as restrictive for delete to anon,authenticated using(bucket_id not in ('berita-gambar','galeri-foto') or (select private.pengurus_role())='admin' or (owner_id=(select auth.uid())::text and not exists(select 1 from public.berita b where b.gambar_url like '%/'||storage.objects.name or b.thumbnail_url like '%/'||storage.objects.name) and not exists(select 1 from public.berita_history h where h.snapshot->>'gambar_url' like '%/'||storage.objects.name or h.snapshot->>'thumbnail_url' like '%/'||storage.objects.name)));
drop policy if exists annahl_upload on storage.objects;
create policy annahl_upload on storage.objects for insert to authenticated with check(bucket_id in ('berita-gambar','galeri-foto') and (select private.pengurus_role()) in ('admin','editor'));
drop policy if exists annahl_delete on storage.objects;
create policy annahl_delete on storage.objects for delete to authenticated using(bucket_id in ('berita-gambar','galeri-foto') and (select private.pengurus_role()) in ('admin','editor'));
drop policy if exists annahl_storage_read on storage.objects;
create policy annahl_storage_read on storage.objects for select to authenticated using(bucket_id in ('berita-gambar','galeri-foto') and (select private.pengurus_role()) in ('admin','editor'));
commit;
