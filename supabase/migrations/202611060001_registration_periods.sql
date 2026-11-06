begin;
alter table public.pondok_settings add column registration jsonb not null default '{}';

create function private.valid_registration(details jsonb, opens date, closes date) returns boolean
language plpgsql immutable set search_path = '' as $$
declare first_selection date; last_selection date; announcement date; year integer;
begin
  if jsonb_typeof(details) is distinct from 'object' or details - array['year','selection_opens_on','selection_closes_on','announcement_on','information','recap_ready','recap_sheet_id'] <> '{}'::jsonb then return false; end if;
  if details = '{}'::jsonb then return true; end if;
  if jsonb_typeof(details->'year') is distinct from 'number' then return false; end if;
  year := (details->>'year')::integer;
  if year not between 2000 and 2099 or jsonb_typeof(details->'information') is distinct from 'string' or char_length(details->>'information') > 1600
    or jsonb_typeof(details->'recap_ready') is distinct from 'boolean' then return false; end if;
  foreach first_selection in array array[opens,closes] loop
    if first_selection is not null and first_selection not between date '2000-01-01' and date '2099-12-31' then return false; end if;
  end loop;
  if opens is null or closes is null then return false; end if;
  if nullif(details->>'selection_opens_on','') is not null and details->>'selection_opens_on' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then return false; end if;
  if nullif(details->>'selection_closes_on','') is not null and details->>'selection_closes_on' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then return false; end if;
  if nullif(details->>'announcement_on','') is not null and details->>'announcement_on' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then return false; end if;
  first_selection := nullif(details->>'selection_opens_on','')::date;
  last_selection := nullif(details->>'selection_closes_on','')::date;
  announcement := nullif(details->>'announcement_on','')::date;
  if (first_selection is null) <> (last_selection is null) or first_selection > last_selection or first_selection <= closes
    or announcement <= coalesce(last_selection, closes) then return false; end if;
  if coalesce((details->>'recap_ready')::boolean,false) and (jsonb_typeof(details->'recap_sheet_id') is distinct from 'number' or (details->>'recap_sheet_id')::bigint not between 0 and 2147483647) then return false; end if;
  return true;
exception when others then return false;
end $$;
revoke all on function private.valid_registration(jsonb,date,date) from public;
alter table public.pondok_settings add constraint valid_registration_period check (private.valid_registration(registration,opens_on,closes_on));

create function public.save_registration_period(p_revision integer, p_opens_on date, p_closes_on date, p_registration jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare previous public.pondok_settings; details jsonb; result public.pondok_settings;
begin
  if (select private.pengurus_role()) is distinct from 'admin' then raise exception 'Hanya admin dapat mengubah penerimaan' using errcode='42501'; end if;
  if jsonb_typeof(p_registration) is distinct from 'object' or p_registration - array['year','selection_opens_on','selection_closes_on','announcement_on','information'] <> '{}'::jsonb then raise exception 'Isian penerimaan tidak sesuai' using errcode='22023'; end if;
  select * into previous from public.pondok_settings where id=1 for update;
  if previous.revision is distinct from p_revision then raise exception 'Jadwal telah diubah pengurus lain' using errcode='40001'; end if;
  details := p_registration || jsonb_build_object('recap_ready',false,'recap_sheet_id',null);
  if previous.registration->'year' = details->'year' then
    details := details || jsonb_build_object('recap_ready',coalesce((previous.registration->>'recap_ready')::boolean,false),'recap_sheet_id',previous.registration->'recap_sheet_id');
  end if;
  update public.pondok_settings set opens_on=p_opens_on, closes_on=p_closes_on, registration=details, revision=revision+1 where id=1 returning * into result;
  return to_jsonb(result);
end $$;

create function public.confirm_registration_sheet(p_year integer, p_sheet_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.pondok_settings;
begin
  if (select private.pengurus_role()) is distinct from 'admin' then raise exception 'Hanya admin dapat menyiapkan rekap' using errcode='42501'; end if;
  if p_sheet_id is null or p_sheet_id not between 0 and 2147483647 then raise exception 'Identitas rekap tidak sesuai' using errcode='22023'; end if;
  select * into result from public.pondok_settings where id=1 for update;
  if (result.registration->>'year')::integer is distinct from p_year then raise exception 'Periode penerimaan telah berubah' using errcode='40001'; end if;
  if coalesce((result.registration->>'recap_ready')::boolean,false) and (result.registration->>'recap_sheet_id')::bigint = p_sheet_id then return to_jsonb(result); end if;
  update public.pondok_settings set registration=registration || jsonb_build_object('recap_ready',true,'recap_sheet_id',p_sheet_id), revision=revision+1 where id=1 returning * into result;
  return to_jsonb(result);
end $$;
revoke all on function public.save_registration_period(integer,date,date,jsonb), public.confirm_registration_sheet(integer,bigint) from public, anon;
grant execute on function public.save_registration_period(integer,date,date,jsonb), public.confirm_registration_sheet(integer,bigint) to authenticated;
commit;
