begin;

create function private.valid_jenjang(items jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb; name text; names text[] := '{}';
begin
  if jsonb_typeof(items) is distinct from 'array' then return false; end if;
  if jsonb_array_length(items) > 20 then return false; end if;
  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) is distinct from 'object'
       or jsonb_typeof(item->'title') is distinct from 'string'
       or jsonb_typeof(item->'description') is distinct from 'string'
       or char_length(item->>'description') > 160
       or item - 'title' - 'description' <> '{}'::jsonb then return false; end if;
    name := item->>'title';
    if name <> btrim(name) or char_length(name) not between 2 and 60
       or name ~ '[[:cntrl:]]' or lower(name) = any(names) then return false; end if;
    names := array_append(names, lower(name));
  end loop;
  return true;
end $$;
revoke all on function private.valid_jenjang(jsonb) from public;

create table public.pondok_settings (
  id integer primary key check (id = 1),
  opens_on date,
  closes_on date,
  levels jsonb not null check (private.valid_jenjang(levels)),
  tiktok text not null default '' check (tiktok = '' or tiktok ~ '^[A-Za-z0-9._]{2,24}$'),
  revision integer not null default 1 check (revision > 0),
  check ((opens_on is null and closes_on is null) or
    (opens_on is not null and closes_on is not null and opens_on <= closes_on
      and opens_on >= date '2000-01-01' and closes_on <= date '2099-12-31' and jsonb_array_length(levels) > 0))
);
insert into public.pondok_settings(id, levels) values
  (1, '[{"title":"SMP","description":"Untuk lulusan SD atau MI."},{"title":"SMA","description":"Untuk lulusan SMP atau MTs."}]');

alter table public.pondok_settings enable row level security;
revoke all on public.pondok_settings from public, anon, authenticated;
grant select on public.pondok_settings to anon, authenticated;
create policy pondok_settings_public_read on public.pondok_settings for select to anon, authenticated using (true);

create function public.save_pondok_settings(p_revision integer, p_opens_on date, p_closes_on date, p_levels jsonb, p_tiktok text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.pondok_settings;
begin
  if (select private.pengurus_role()) is distinct from 'admin' then
    raise exception 'Hanya admin dapat mengubah pengaturan pondok' using errcode = '42501';
  end if;
  update public.pondok_settings set opens_on=p_opens_on, closes_on=p_closes_on, levels=p_levels,
    tiktok=p_tiktok, revision=revision+1 where id=1 and revision=p_revision returning * into result;
  if not found then raise exception 'Pengaturan telah diubah oleh pengurus lain' using errcode = '40001'; end if;
  return to_jsonb(result);
end $$;
revoke all on function public.save_pondok_settings(integer,date,date,jsonb,text) from public, anon;
grant execute on function public.save_pondok_settings(integer,date,date,jsonb,text) to authenticated;
commit;
