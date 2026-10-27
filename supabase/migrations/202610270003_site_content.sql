-- Editable website content; apply after 202610260001_editorial.sql.
-- Independent from the optional Google form boundary migration.
begin;

create or replace function private.valid_site_content(document jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select case
    when document is null or jsonb_typeof(document) <> 'object'
      or document->'version' is distinct from '1'::jsonb
      or jsonb_typeof(document->'values') is distinct from 'object'
      or jsonb_typeof(document->'hidden') is distinct from 'array' then false
    else octet_length(document::text) <= 96000
      and not exists (select 1 from jsonb_object_keys(document) k where k not in ('version','values','hidden'))
      and (select count(*) from jsonb_each(document->'values')) <= 600
      and jsonb_array_length(document->'hidden') <= 40
      and not exists (select 1 from jsonb_each(document->'values') f
        where f.key !~ '^[a-z0-9:-]{1,180}$' or jsonb_typeof(f.value) <> 'string' or length(f.value#>>'{}') > 8000)
      and not exists (select 1 from jsonb_array_elements(document->'hidden') h
        where jsonb_typeof(h) <> 'string' or (h#>>'{}') !~ '^b-[a-z0-9]+$')
    end
$$;
revoke all on function private.valid_site_content(jsonb) from public;

create table if not exists public.site_content (
  page_id text not null check(page_id in ('beranda','tentang','program','pendaftaran','donasi','kontak','berita','galeri','global')),
  state text not null check(state in ('draft','published')),
  content jsonb not null check(private.valid_site_content(content)),
  revision bigint not null default 1 check(revision > 0),
  updated_at timestamptz not null default now(),
  primary key(page_id,state)
);
create table if not exists public.site_content_history (
  id bigint generated always as identity primary key,
  page_id text not null,
  content jsonb not null check(private.valid_site_content(content)),
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists site_content_history_page_idx on public.site_content_history(page_id,created_at desc);

alter table public.site_content enable row level security;
alter table public.site_content_history enable row level security;
revoke all on public.site_content,public.site_content_history from anon,authenticated;
grant select on public.site_content to anon,authenticated;
grant select on public.site_content_history to authenticated;
drop policy if exists website_published_read on public.site_content;
create policy website_published_read on public.site_content for select to anon,authenticated
  using(state='published');
drop policy if exists website_drafts_admin on public.site_content;
create policy website_drafts_admin on public.site_content for select to authenticated
  using((select private.pengurus_role())='admin');
drop policy if exists website_history_admin on public.site_content_history;
create policy website_history_admin on public.site_content_history for select to authenticated
  using((select private.pengurus_role())='admin');

create or replace function public.save_site_content(
  p_page_id text, p_content jsonb, p_draft_revision bigint,
  p_published_revision bigint, p_publish boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_draft bigint; current_published bigint; draft_row jsonb; published_row jsonb;
begin
  if (select private.pengurus_role()) is distinct from 'admin' then
    raise exception 'Hanya admin pondok dapat mengubah website' using errcode='42501';
  end if;
  if p_page_id is null or p_page_id not in ('beranda','tentang','program','pendaftaran','donasi','kontak','berita','galeri','global')
    or not private.valid_site_content(p_content)
    or p_draft_revision is null or p_draft_revision < 0
    or p_published_revision is null or p_published_revision < 0 or p_publish is null then
    raise exception 'Isi halaman belum sesuai' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('annahl.site:'||p_page_id,0));
  select revision into current_draft from public.site_content where page_id=p_page_id and state='draft';
  select revision into current_published from public.site_content where page_id=p_page_id and state='published';
  if coalesce(current_draft,0) <> p_draft_revision or coalesce(current_published,0) <> p_published_revision then
    raise exception 'Halaman telah diubah pengurus lain' using errcode='40001';
  end if;
  insert into public.site_content(page_id,state,content,revision,updated_at)
  values(p_page_id,'draft',p_content,1,clock_timestamp())
  on conflict(page_id,state) do update set content=excluded.content,revision=site_content.revision+1,updated_at=excluded.updated_at;
  if p_publish then
    insert into public.site_content(page_id,state,content,revision,updated_at)
    values(p_page_id,'published',p_content,1,clock_timestamp())
    on conflict(page_id,state) do update set content=excluded.content,revision=site_content.revision+1,updated_at=excluded.updated_at;
    insert into public.site_content_history(page_id,content,actor_id) values(p_page_id,p_content,auth.uid());
  end if;
  select to_jsonb(s) into draft_row from public.site_content s where page_id=p_page_id and state='draft';
  select to_jsonb(s) into published_row from public.site_content s where page_id=p_page_id and state='published';
  return jsonb_build_object('draft',draft_row,'published',published_row);
end $$;
revoke all on function public.save_site_content(text,jsonb,bigint,bigint,boolean) from public;
grant execute on function public.save_site_content(text,jsonb,bigint,bigint,boolean) to authenticated;

commit;
