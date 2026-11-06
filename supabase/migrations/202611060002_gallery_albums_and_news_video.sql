begin;

alter table public.berita add column if not exists youtube_id text;
alter table public.berita drop constraint if exists berita_youtube_id_valid;
alter table public.berita add constraint berita_youtube_id_valid check(youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$');

create or replace function private.gallery_photos_valid(items jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare photo jsonb; seen_ids text[]='{}'; seen_urls text[]='{}';
begin
  if items is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items)>100 or octet_length(items::text)>500000 then return false; end if;
  for photo in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(photo)<>'object' or exists(select 1 from jsonb_object_keys(photo) k where k not in ('id','judul','caption','gambar_url','thumbnail_url'))
      or coalesce(jsonb_typeof(photo->'id'),'')<>'string' or coalesce(photo->>'id','') !~ '^[A-Za-z0-9_-]{1,80}$'
      or (photo->>'id')=any(seen_ids) or (photo->>'gambar_url')=any(seen_urls)
      or coalesce(jsonb_typeof(photo->'judul'),'')<>'string' or char_length(photo->>'judul')>140
      or coalesce(jsonb_typeof(photo->'caption'),'')<>'string' or char_length(photo->>'caption')>800 then return false; end if;
    if coalesce(photo->>'gambar_url','') !~ '^(https://[^[:space:]<>]+|/[^/][^[:space:]<>]*)$'
      or coalesce(photo->>'thumbnail_url','') !~ '^(https://[^[:space:]<>]+|/[^/][^[:space:]<>]*)$'
      or char_length(photo->>'gambar_url')>2048 or char_length(photo->>'thumbnail_url')>2048 then return false; end if;
    seen_ids=array_append(seen_ids,photo->>'id');seen_urls=array_append(seen_urls,photo->>'gambar_url');
  end loop;
  return true;
end $$;
revoke all on function private.gallery_photos_valid(jsonb) from public;
grant execute on function private.gallery_photos_valid(jsonb) to authenticated;

create table if not exists public.galeri_album (
  id uuid primary key default gen_random_uuid(),
  judul text not null check(char_length(btrim(judul)) between 1 and 140),
  kategori text not null check(kategori in ('Akademik','Ibadah','Acara','Fasilitas','Ekskul')),
  deskripsi text not null default '' check(char_length(deskripsi)<=4000),
  tanggal date,
  status text not null default 'draft' check(status in ('draft','published')),
  photos jsonb not null default '[]' check(private.gallery_photos_valid(photos)),
  sampul_id text,
  sampul_url text not null default '',
  sampul_thumbnail text not null default '',
  photo_count integer generated always as (jsonb_array_length(photos)) stored,
  revision integer not null default 1 check(revision>0),
  deleted_at timestamptz,
  dibuat_pada timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_published_has_photos check(status<>'published' or jsonb_array_length(photos)>0)
);
create index if not exists gallery_album_public_idx on public.galeri_album(dibuat_pada desc,id) where deleted_at is null and status='published';
alter table public.galeri_album enable row level security;
revoke all on public.galeri_album from anon,authenticated;
grant select on public.galeri_album to anon,authenticated;
drop policy if exists gallery_album_public on public.galeri_album;
create policy gallery_album_public on public.galeri_album for select to anon,authenticated using(status='published' and deleted_at is null);
drop policy if exists gallery_album_admin on public.galeri_album;
create policy gallery_album_admin on public.galeri_album for select to authenticated using((select private.pengurus_role())='admin');

create or replace function public.save_gallery_album(p_id uuid,p_revision integer,p_album jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_row public.galeri_album; saved public.galeri_album; cover jsonb; cover_id text; album_date date;
begin
  if coalesce(private.pengurus_role(),'')<>'admin' then raise exception 'Hanya admin yang dapat mengelola album.' using errcode='42501'; end if;
  if p_id is null or p_revision is null or p_revision<0 or jsonb_typeof(p_album)<>'object'
    or exists(select 1 from jsonb_object_keys(p_album) k where k not in ('judul','kategori','deskripsi','tanggal','status','photos','sampul_id'))
    or coalesce(jsonb_typeof(p_album->'judul'),'')<>'string' or char_length(btrim(p_album->>'judul')) not between 1 and 140
    or coalesce(p_album->>'kategori','') not in ('Akademik','Ibadah','Acara','Fasilitas','Ekskul')
    or coalesce(jsonb_typeof(p_album->'deskripsi'),'')<>'string' or char_length(p_album->>'deskripsi')>4000
    or coalesce(p_album->>'status','') not in ('draft','published')
    or not private.gallery_photos_valid(p_album->'photos') then raise exception 'Periksa isian album.' using errcode='22023'; end if;
  if p_album->>'status'='published' and jsonb_array_length(p_album->'photos')=0 then raise exception 'Tambahkan foto sebelum menerbitkan album.' using errcode='22023'; end if;
  if coalesce(p_album->>'tanggal','')<>'' then
    if p_album->>'tanggal' !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Tanggal kegiatan tidak sesuai.' using errcode='22023'; end if;
    album_date=(p_album->>'tanggal')::date;
  end if;
  cover_id=nullif(p_album->>'sampul_id','');
  select value into cover from jsonb_array_elements(p_album->'photos') where value->>'id'=cover_id limit 1;
  if cover_id is not null and cover is null then raise exception 'Foto sampul harus berasal dari album ini.' using errcode='22023'; end if;
  if cover is null then select value into cover from jsonb_array_elements(p_album->'photos') limit 1; cover_id=cover->>'id'; end if;
  select * into current_row from public.galeri_album where id=p_id for update;
  if not found then
    if p_revision<>0 then raise exception 'Album sudah diubah.' using errcode='40001'; end if;
    insert into public.galeri_album(id,judul,kategori,deskripsi,tanggal,status,photos,sampul_id,sampul_url,sampul_thumbnail)
      values(p_id,btrim(p_album->>'judul'),p_album->>'kategori',p_album->>'deskripsi',album_date,p_album->>'status',p_album->'photos',cover_id,coalesce(cover->>'gambar_url',''),coalesce(cover->>'thumbnail_url','')) returning * into saved;
  else
    if current_row.revision<>p_revision or current_row.deleted_at is not null then raise exception 'Album sudah diubah atau diarsipkan.' using errcode='40001'; end if;
    update public.galeri_album set judul=btrim(p_album->>'judul'),kategori=p_album->>'kategori',deskripsi=p_album->>'deskripsi',tanggal=album_date,status=p_album->>'status',photos=p_album->'photos',sampul_id=cover_id,sampul_url=coalesce(cover->>'gambar_url',''),sampul_thumbnail=coalesce(cover->>'thumbnail_url',''),revision=revision+1,updated_at=now() where id=p_id returning * into saved;
  end if;
  return to_jsonb(saved);
end $$;

create or replace function public.archive_gallery_album(p_id uuid,p_revision integer,p_archived boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare saved public.galeri_album;
begin
  if coalesce(private.pengurus_role(),'')<>'admin' then raise exception 'Hanya admin yang dapat mengelola album.' using errcode='42501'; end if;
  if p_archived is null then raise exception 'Tindakan album tidak sesuai.' using errcode='22023'; end if;
  update public.galeri_album set deleted_at=case when p_archived then now() else null end,
    status=case when p_archived then status else 'draft' end,revision=revision+1,updated_at=now()
    where id=p_id and revision=p_revision returning * into saved;
  if not found then raise exception 'Album sudah diubah.' using errcode='40001'; end if;
  return to_jsonb(saved);
end $$;
revoke all on function public.save_gallery_album(uuid,integer,jsonb),public.archive_gallery_album(uuid,integer,boolean) from public;
grant execute on function public.save_gallery_album(uuid,integer,jsonb),public.archive_gallery_album(uuid,integer,boolean) to authenticated;

-- Initial albums use only photos already shipped with the public website.
-- Their stable IDs and recoverable archive keep migration retries idempotent.

insert into public.galeri_album(id,judul,kategori,deskripsi,status,photos,sampul_id,sampul_url,sampul_thumbnail) values
('a11a0000-0000-4000-8000-000000000001','Akademik di An-Nahl','Akademik','Kegiatan belajar, pendidikan formal, dan pengembangan pengetahuan santri.','published','[{"id":"awal-1-1","judul":"Program Bahasa Arab","caption":"Program Bahasa Arab","gambar_url":"/media/0af171a83b40dbfb-1600.jpg","thumbnail_url":"/media/0af171a83b40dbfb-480.jpg"},{"id":"awal-1-2","judul":"Kegiatan Sekolah Formal","caption":"Kegiatan Sekolah Formal","gambar_url":"/media/4d848c0f407bee53-1600.jpg","thumbnail_url":"/media/4d848c0f407bee53-480.jpg"},{"id":"awal-1-3","judul":"Kelas Muhadloroh","caption":"Kelas Muhadloroh","gambar_url":"/media/bca780cfb9beabf2-1600.jpg","thumbnail_url":"/media/bca780cfb9beabf2-480.jpg"}]'::jsonb,'awal-1-1','/media/0af171a83b40dbfb-1600.jpg','/media/0af171a83b40dbfb-480.jpg'),
('a11a0000-0000-4000-8000-000000000002','Ibadah di An-Nahl','Ibadah','Momen belajar Al-Quran, ibadah, dan pembinaan keislaman di pondok.','published','[{"id":"awal-2-1","judul":"Program Tahfidz Al-Quran","caption":"Program Tahfidz Al-Quran","gambar_url":"/media/efc3c76e6e6f427e-1600.jpg","thumbnail_url":"/media/efc3c76e6e6f427e-480.jpg"},{"id":"awal-2-2","judul":"Sholat Jamaah","caption":"Sholat Jamaah","gambar_url":"/media/baaf70d490575d88-1600.jpg","thumbnail_url":"/media/baaf70d490575d88-480.jpg"},{"id":"awal-2-3","judul":"Al Kahfi Day","caption":"Al Kahfi Day","gambar_url":"/media/2cd307bea604c6c8-1600.jpg","thumbnail_url":"/media/2cd307bea604c6c8-480.jpg"},{"id":"awal-2-4","judul":"Ekstrakurikuler Hadroh","caption":"Ekstrakurikuler Hadroh","gambar_url":"/media/49eea1039a995176-1600.jpg","thumbnail_url":"/media/49eea1039a995176-480.jpg"},{"id":"awal-2-5","judul":"Ekstrakurikuler Marawis","caption":"Ekstrakurikuler Marawis","gambar_url":"/media/456075adda03109a-1600.jpg","thumbnail_url":"/media/456075adda03109a-480.jpg"}]'::jsonb,'awal-2-1','/media/efc3c76e6e6f427e-1600.jpg','/media/efc3c76e6e6f427e-480.jpg'),
('a11a0000-0000-4000-8000-000000000003','Acara di An-Nahl','Acara','Kebersamaan santri, kegiatan pondok, dan silaturahmi keluarga besar An-Nahl.','published','[{"id":"awal-3-1","judul":"Acara Pondok","caption":"Acara Pondok","gambar_url":"/media/ffab06cb303c68e0-1600.jpg","thumbnail_url":"/media/ffab06cb303c68e0-480.jpg"},{"id":"awal-3-2","judul":"Program PPDA & PPDU","caption":"Program PPDA & PPDU","gambar_url":"/media/e91d4ab7e5bf6bf1-1600.jpg","thumbnail_url":"/media/e91d4ab7e5bf6bf1-480.jpg"},{"id":"awal-3-3","judul":"Kunjungan Tamu","caption":"Kunjungan Tamu","gambar_url":"/media/58da2b1ea3571f5d-1600.jpg","thumbnail_url":"/media/58da2b1ea3571f5d-480.jpg"},{"id":"awal-3-4","judul":"Khitobiyyah Santri","caption":"Khitobiyyah Santri","gambar_url":"/media/8face00105d25c27-1600.jpg","thumbnail_url":"/media/8face00105d25c27-480.jpg"},{"id":"awal-3-5","judul":"Hiburan Santri","caption":"Hiburan Santri","gambar_url":"/media/323d8624d1b4133c-1600.jpg","thumbnail_url":"/media/323d8624d1b4133c-480.jpg"},{"id":"awal-3-6","judul":"Gotong Royong Bersih-bersih","caption":"Gotong Royong Bersih-bersih","gambar_url":"/media/4ece44d094f1e401-1600.jpg","thumbnail_url":"/media/4ece44d094f1e401-480.jpg"}]'::jsonb,'awal-3-1','/media/ffab06cb303c68e0-1600.jpg','/media/ffab06cb303c68e0-480.jpg'),
('a11a0000-0000-4000-8000-000000000004','Fasilitas di An-Nahl','Fasilitas','Suasana pondok, keterampilan, dan kegiatan pemberdayaan santri.','published','[{"id":"awal-4-1","judul":"Peternakan Kambing","caption":"Peternakan Kambing","gambar_url":"/media/99e0e7e19549dd16-1600.jpg","thumbnail_url":"/media/99e0e7e19549dd16-480.jpg"},{"id":"awal-4-2","judul":"Peternakan Perikanan","caption":"Peternakan Perikanan","gambar_url":"/media/cc2944b26c71d48a-1600.jpg","thumbnail_url":"/media/cc2944b26c71d48a-480.jpg"},{"id":"awal-4-3","judul":"Peternakan Bebek","caption":"Peternakan Bebek","gambar_url":"/media/d43a6be1d8122dac-1600.jpg","thumbnail_url":"/media/d43a6be1d8122dac-480.jpg"},{"id":"awal-4-4","judul":"Ekstrakurikuler Futsal","caption":"Ekstrakurikuler Futsal","gambar_url":"/media/e40a89e55509450e-1600.jpg","thumbnail_url":"/media/e40a89e55509450e-480.jpg"},{"id":"awal-4-5","judul":"Ekstrakurikuler Pencak Silat","caption":"Ekstrakurikuler Pencak Silat","gambar_url":"/media/fa7b9aa57d5964c5-1600.jpg","thumbnail_url":"/media/fa7b9aa57d5964c5-480.jpg"},{"id":"awal-4-6","judul":"Ekstrakurikuler Melukis","caption":"Ekstrakurikuler Melukis","gambar_url":"/media/4197b641b03d67eb-1600.jpg","thumbnail_url":"/media/4197b641b03d67eb-480.jpg"},{"id":"awal-4-7","judul":"Makan Bersama Santri","caption":"Makan Bersama Santri","gambar_url":"/media/e3f9681fd9367ad2-1600.jpg","thumbnail_url":"/media/e3f9681fd9367ad2-480.jpg"},{"id":"awal-4-8","judul":"Senam Pagi Santri","caption":"Senam Pagi Santri","gambar_url":"/media/eb32df4a9aaeca00-1600.jpg","thumbnail_url":"/media/eb32df4a9aaeca00-480.jpg"}]'::jsonb,'awal-4-1','/media/99e0e7e19549dd16-1600.jpg','/media/99e0e7e19549dd16-480.jpg')
on conflict(id) do nothing;

notify pgrst,'reload schema';
commit;
