-- SQL Editor smoke test. All fixtures stay inside this transaction and are rolled back.
begin;
set local "request.jwt.claim.sub" = '';
set local "request.jwt.claims" = '{}';
insert into auth.users(id,email,aud,role) values
('f7c20000-0000-4000-8000-000000000001','editorial-admin@invalid.example','authenticated','authenticated'),
('f7c20000-0000-4000-8000-000000000002','editorial-writer-a@invalid.example','authenticated','authenticated'),
('f7c20000-0000-4000-8000-000000000003','editorial-writer-b@invalid.example','authenticated','authenticated');
insert into public.pengurus(id,display_name,role) values
('f7c20000-0000-4000-8000-000000000001','Test Admin','admin'),
('f7c20000-0000-4000-8000-000000000002','Test Writer A','editor'),
('f7c20000-0000-4000-8000-000000000003','Test Writer B','editor');
insert into public.berita(id,judul,kategori,isi,status,author_id,deleted_at) values
('f7c20000-0000-4000-8000-000000000010','RLS published','Akademik','Test','published','f7c20000-0000-4000-8000-000000000002',null),
('f7c20000-0000-4000-8000-000000000011','RLS draft A','Akademik','Test','draft','f7c20000-0000-4000-8000-000000000002',null),
('f7c20000-0000-4000-8000-000000000012','RLS draft B','Akademik','Test','draft','f7c20000-0000-4000-8000-000000000003',null),
('f7c20000-0000-4000-8000-000000000013','RLS archived','Akademik','Test','published','f7c20000-0000-4000-8000-000000000002',now());

set local role anon;
do $$ begin
  if (select count(*) from public.berita where id::text like 'f7c20000-%') <> 1 then raise exception 'FAIL anon: draft/archive visibility'; end if;
  begin perform * from public.pengurus; raise exception 'FAIL anon: profile read allowed'; exception when insufficient_privilege then null; end;
  begin perform * from public.berita_history; raise exception 'FAIL anon: history read allowed'; exception when insufficient_privilege then null; end;
  begin perform * from public.form_submissions; raise exception 'FAIL anon: submission read allowed'; exception when insufficient_privilege then null; end;
end $$;
insert into public.form_submissions(id,kind,payload) values
('f7c20000-0000-4000-8000-000000000020','kontak','{"nama":"RLS Test","email":"test@invalid.example","pesan":"Test message"}');
do $$ begin
  begin insert into public.form_submissions(kind,payload,status) values('kontak','{"nama":"RLS Test","email":"test@invalid.example","pesan":"Test"}','selesai'); raise exception 'FAIL anon: status override allowed'; exception when insufficient_privilege then null; end;
end $$;

reset role;
set local "request.jwt.claim.sub" = 'f7c20000-0000-4000-8000-000000000002';
set local "request.jwt.claims" = '{"sub":"f7c20000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;
do $$ declare changed integer; begin
  if exists(select 1 from public.berita where id='f7c20000-0000-4000-8000-000000000012') then raise exception 'FAIL writer: another draft readable'; end if;
  update public.berita set isi='Updated by writer' where id='f7c20000-0000-4000-8000-000000000011';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL writer: own draft update denied'; end if;
  update public.berita set isi='Unwanted update' where id='f7c20000-0000-4000-8000-000000000012';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL writer: another draft updated'; end if;
  begin update public.berita set status='published' where id='f7c20000-0000-4000-8000-000000000011'; raise exception 'FAIL writer: publishing allowed'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; when insufficient_privilege then null; end;
  update public.pengurus set role='admin' where id=auth.uid();
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL writer: self-promotion allowed'; end if;
  if exists(select 1 from public.form_submissions) then raise exception 'FAIL writer: private inbox readable'; end if;
end $$;
insert into public.berita(id,judul,kategori,isi,status,author_id) values
('f7c20000-0000-4000-8000-000000000014','Writer-created draft','Akademik','','draft','f7c20000-0000-4000-8000-000000000003');
do $$ begin
  if not exists(select 1 from public.berita where id='f7c20000-0000-4000-8000-000000000014' and author_id=auth.uid()) then raise exception 'FAIL writer: author identity not enforced'; end if;
end $$;

reset role;
set local "request.jwt.claim.sub" = 'f7c20000-0000-4000-8000-000000000001';
set local "request.jwt.claims" = '{"sub":"f7c20000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
update public.berita set status='published' where id='f7c20000-0000-4000-8000-000000000011';
update public.berita set deleted_at=now() where id='f7c20000-0000-4000-8000-000000000011';
update public.berita set deleted_at=null,status='draft' where id='f7c20000-0000-4000-8000-000000000011';
update public.form_submissions set status='diproses' where id='f7c20000-0000-4000-8000-000000000020';
do $$ begin
  if not exists(select 1 from public.berita where id='f7c20000-0000-4000-8000-000000000011' and status='draft' and deleted_at is null) then raise exception 'FAIL admin: publish/archive/restore'; end if;
  if (select count(*) from public.berita_history where news_id='f7c20000-0000-4000-8000-000000000011') < 5 then raise exception 'FAIL admin: missing audit history'; end if;
  if not exists(select 1 from public.form_submissions where id='f7c20000-0000-4000-8000-000000000020' and status='diproses') then raise exception 'FAIL admin: inbox update'; end if;
  begin update public.pengurus set active=false where id=auth.uid(); raise exception 'FAIL admin: self-deactivation allowed'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
end $$;
update public.pengurus set active=false where id='f7c20000-0000-4000-8000-000000000002';
reset role;
set local "request.jwt.claim.sub" = 'f7c20000-0000-4000-8000-000000000002';
set local "request.jwt.claims" = '{"sub":"f7c20000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;
do $$ declare changed integer; begin
  update public.berita set isi='Inactive write' where id='f7c20000-0000-4000-8000-000000000011';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL inactive writer: update allowed'; end if;
end $$;
reset role;
rollback;
select 'PASS' as result, 'Anon privacy; writer ownership; admin publishing/archive/restore; history; inbox; inactive account' as checks, 'All test fixtures rolled back' as cleanup;
