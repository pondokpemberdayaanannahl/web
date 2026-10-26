-- Run after both migrations in a test/staging database. All fixtures roll back.
begin;
update private.sheets_sync_settings set enabled = true,
  secret_hash = sha256(convert_to(repeat('a', 64), 'UTF8')) where singleton;
-- Isolate fixtures from pending live rows inside this rolled-back transaction.
update private.sheets_sync_queue set synced_revision = revision;

insert into public.form_submissions(id, kind, payload) values
  ('f7c30000-0000-4000-8000-000000000001', 'pendaftaran', '{"nama":"Santri Uji", "namaWali":"Wali Uji", "noWA":"081200000000", "unrelated":"must not export"}');

set local role anon;
insert into public.form_submissions(id, kind, payload) values
  ('f7c30000-0000-4000-8000-000000000002', 'donasi', '{"nama":"Donatur Uji", "jumlah":"100000"}'),
  ('f7c30000-0000-4000-8000-000000000003', 'kontak', '{"nama":"Pesan Uji", "email":"uji@example.org", "pesan":"must not export"}');
do $$ declare failed boolean := false; result record; begin
  begin perform public.sheets_sync_pull(repeat('b', 64)); exception when invalid_authorization_specification then failed := true; end;
  if not failed then raise exception 'Wrong secret was accepted'; end if;
  failed := false;
  begin perform public.sheets_sync_ack(repeat('b', 64), '[]'); exception when invalid_authorization_specification then failed := true; end;
  if not failed then raise exception 'Wrong secret acknowledged rows'; end if;
  begin perform * from private.sheets_sync_settings; raise exception 'Secret hash table readable'; exception when insufficient_privilege then null; end;
  begin perform * from public.form_submissions; raise exception 'Raw inbox readable'; exception when insufficient_privilege then null; end;
  if (select count(*) from public.sheets_sync_pull(repeat('a', 64), 100)) <> 2 then raise exception 'Expected exactly two queued fixtures'; end if;
  for result in select * from public.sheets_sync_pull(repeat('a', 64), 100) loop
    if result.kind not in ('pendaftaran', 'donasi') then raise exception 'Contact data was exported'; end if;
    if result.payload ? 'unrelated' then raise exception 'Unknown payload field was exported'; end if;
  end loop;
end $$;
reset role;

-- Simulate an admin status change after the worker has already received revision 1.
update public.form_submissions set status = 'diproses' where id = 'f7c30000-0000-4000-8000-000000000001';
set local role anon;
select public.sheets_sync_ack(repeat('a', 64), '[{"id":"f7c30000-0000-4000-8000-000000000001", "revision":"1"}]');
reset role;
do $$ begin
  if not exists(select 1 from private.sheets_sync_queue where submission_id = 'f7c30000-0000-4000-8000-000000000001' and revision = 2 and synced_revision = 0) then
    raise exception 'Acknowledging an older revision lost a concurrent update';
  end if;
end $$;

set local role anon;
select public.sheets_sync_ack(repeat('a', 64), '[{"id":"f7c30000-0000-4000-8000-000000000001", "revision":"2"}, {"id":"f7c30000-0000-4000-8000-000000000002", "revision":"1"}]');
do $$ begin
  if exists(select 1 from public.sheets_sync_pull(repeat('a', 64), 100) where id::text like 'f7c30000-%') then raise exception 'Acknowledged rows still pending'; end if;
end $$;
reset role;

update private.sheets_sync_settings set enabled = false where singleton;
set local role anon;
do $$ declare failed boolean := false; begin
  begin perform public.sheets_sync_pull(repeat('a', 64)); exception when invalid_authorization_specification then failed := true; end;
  if not failed then raise exception 'Disabled integration still exports'; end if;
end $$;
reset role;
select 'PASS' as result, 'Secret isolation; field scope; queue retry; concurrent update; disable switch' as verified;
rollback;
