-- Registration/donation confirmations now belong to the owner's Google account.
-- Keep the contact inbox in Supabase; preserve all existing records.
begin;
drop policy if exists public_submission on public.form_submissions;
create policy public_submission on public.form_submissions for insert to anon,authenticated
  with check(status='baru' and kind='kontak');
commit;
