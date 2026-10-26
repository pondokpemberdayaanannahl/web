-- Inactive legacy proposal. Do not apply for direct Google-only form storage.
-- Disabled until a separately generated secret is configured by the project owner.
begin;

create table if not exists private.sheets_sync_settings (
  singleton boolean primary key default true check(singleton),
  secret_hash bytea,
  enabled boolean not null default false,
  check(secret_hash is null or octet_length(secret_hash) = 32)
);
insert into private.sheets_sync_settings(singleton) values(true) on conflict do nothing;

create table if not exists private.sheets_sync_queue (
  submission_id uuid primary key references public.form_submissions(id) on delete cascade,
  revision bigint not null default 1 check(revision > 0),
  synced_revision bigint not null default 0 check(synced_revision >= 0 and synced_revision <= revision),
  queued_at timestamptz not null default now(),
  synced_at timestamptz
);
create index if not exists sheets_sync_pending_idx on private.sheets_sync_queue(queued_at, submission_id)
  where synced_revision < revision;
revoke all on private.sheets_sync_settings, private.sheets_sync_queue from public, anon, authenticated;
alter table private.sheets_sync_settings enable row level security;
alter table private.sheets_sync_queue enable row level security;

create or replace function private.queue_sheets_submission() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.kind not in ('pendaftaran', 'donasi') then return new; end if;
  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status and new.payload is not distinct from old.payload then return new; end if;
  end if;
  insert into private.sheets_sync_queue as q(submission_id) values(new.id)
  on conflict(submission_id) do update set revision = q.revision + 1, queued_at = now();
  return new;
end $$;
revoke all on function private.queue_sheets_submission() from public, anon, authenticated;
drop trigger if exists queue_sheets_submission on public.form_submissions;
create trigger queue_sheets_submission after insert or update on public.form_submissions
  for each row execute function private.queue_sheets_submission();

-- Existing registrations and donation confirmations join the same retry queue.
insert into private.sheets_sync_queue(submission_id)
select id from public.form_submissions where kind in ('pendaftaran', 'donasi')
on conflict do nothing;

create or replace function private.require_sheets_secret(p_secret text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or p_secret !~ '^[a-f0-9]{64}$' then
    raise exception 'Sheets sync access denied' using errcode = '28000';
  end if;
  if not exists(select 1 from private.sheets_sync_settings
    where singleton and enabled and secret_hash = sha256(convert_to(p_secret, 'UTF8'))) then
    raise exception 'Sheets sync access denied' using errcode = '28000';
  end if;
end $$;
revoke all on function private.require_sheets_secret(text) from public, anon, authenticated;

-- These two RPCs require a 256-bit integration secret in addition to the public API key.
-- They never return accounts, contact messages, news, or arbitrary table contents.
create or replace function public.sheets_sync_pull(p_secret text, p_limit integer default 50)
returns table(id uuid, revision text, kind text, payload jsonb, status text, dibuat_pada timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_sheets_secret(p_secret);
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Batch size must be between 1 and 100' using errcode = '22023';
  end if;
  return query
  select s.id, q.revision::text, s.kind,
    case when s.kind = 'pendaftaran' then jsonb_build_object(
      'nama', s.payload->>'nama', 'tempatLahir', s.payload->>'tempatLahir',
      'tanggalLahir', s.payload->>'tanggalLahir', 'jenisKelamin', s.payload->>'jenisKelamin',
      'asalSekolah', s.payload->>'asalSekolah', 'program', s.payload->>'program',
      'namaWali', s.payload->>'namaWali', 'noWA', s.payload->>'noWA',
      'email', s.payload->>'email', 'alamat', s.payload->>'alamat')
    else jsonb_build_object('nama', s.payload->>'nama', 'jumlah', s.payload->>'jumlah',
      'metode', s.payload->>'metode', 'program', s.payload->>'program', 'pesan', s.payload->>'pesan') end,
    s.status, s.dibuat_pada
  from private.sheets_sync_queue q join public.form_submissions s on s.id = q.submission_id
  where q.synced_revision < q.revision and s.kind in ('pendaftaran', 'donasi')
  order by q.queued_at, q.submission_id limit p_limit;
end $$;
revoke all on function public.sheets_sync_pull(text, integer) from public, anon, authenticated;
grant execute on function public.sheets_sync_pull(text, integer) to anon;

-- Acknowledge only after Google Sheets has flushed its writes. A newer revision
-- arriving during the write stays pending, so a status change cannot be lost.
create or replace function public.sheets_sync_ack(p_secret text, p_receipts jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  perform private.require_sheets_secret(p_secret);
  if p_receipts is null or jsonb_typeof(p_receipts) <> 'array' then
    raise exception 'Expected receipt array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_receipts) > 100 then
    raise exception 'Too many receipts' using errcode = '22023';
  end if;
  update private.sheets_sync_queue q
  set synced_revision = q.revision, synced_at = now()
  from jsonb_to_recordset(p_receipts) as r(id uuid, revision bigint)
  where q.submission_id = r.id and q.revision = r.revision and q.synced_revision < q.revision;
  get diagnostics changed = row_count;
  return changed;
end $$;
revoke all on function public.sheets_sync_ack(text, jsonb) from public, anon, authenticated;
grant execute on function public.sheets_sync_ack(text, jsonb) to anon;

commit;
