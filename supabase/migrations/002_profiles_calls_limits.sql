begin;
-- One replaceable private avatar per account; no profile role/group update grant.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];
create policy avatar_read on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (
  name = auth.uid()::text || '/profile.jpg' or
  exists (select 1 from public.profiles p where name = p.id::text || '/profile.jpg' and p.group_id = public.my_group())
));
create policy avatar_insert on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and name = auth.uid()::text || '/profile.jpg');
create policy avatar_update on storage.objects for update to authenticated
using (bucket_id = 'avatars' and name = auth.uid()::text || '/profile.jpg')
with check (bucket_id = 'avatars' and name = auth.uid()::text || '/profile.jpg');
create policy avatar_delete on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and name = auth.uid()::text || '/profile.jpg');

-- Preserve existing external meetings. New meetings use LiveKit.
alter table public.meetings add column provider text not null default 'external'
  check (provider in ('external', 'livekit'));
alter table public.meetings alter column provider set default 'livekit';
alter table public.meetings alter column url drop not null;

-- Server-only atomic counters; never store OTPs or raw phone numbers.
create table public.service_usage (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0,
  last_used timestamptz
);
alter table public.service_usage enable row level security;
revoke all on public.service_usage from public, anon, authenticated;

create function public.reserve_sms(p_phone text, p_daily_limit integer default 500)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  moment timestamptz := clock_timestamp();
  day_start timestamptz := date_trunc('day', moment at time zone 'UTC') at time zone 'UTC';
  phone_key text;
  total public.service_usage%rowtype;
  person public.service_usage%rowtype;
begin
  if p_phone !~ '^989[0-9]{9}$' or p_daily_limit not between 1 and 10000 then return false; end if;
  phone_key := 'sms:' || encode(sha256(convert_to(p_phone, 'UTF8')), 'hex');
  -- All callers lock in the same order. Concurrent requests cannot overspend.
  insert into public.service_usage(key, window_start) values ('sms:all', day_start) on conflict do nothing;
  select * into total from public.service_usage where key = 'sms:all' for update;
  insert into public.service_usage(key, window_start) values (phone_key, day_start) on conflict do nothing;
  select * into person from public.service_usage where key = phone_key for update;
  if total.window_start < day_start then total.count := 0; end if;
  if person.window_start < day_start then person.count := 0; end if;
  if total.count >= p_daily_limit or person.count >= 5
     or person.last_used > moment - interval '60 seconds' then return false; end if;
  update public.service_usage set count = total.count + 1, window_start = day_start, last_used = moment where key = 'sms:all';
  update public.service_usage set count = person.count + 1, window_start = day_start, last_used = moment where key = phone_key;
  return true;
end; $$;
revoke all on function public.reserve_sms(text, integer) from public, anon, authenticated;
grant execute on function public.reserve_sms(text, integer) to service_role;

create function public.reserve_call_token(p_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare moment timestamptz := clock_timestamp(); usage public.service_usage%rowtype;
begin
  insert into public.service_usage(key, window_start) values ('call:' || p_user::text, moment) on conflict do nothing;
  select * into usage from public.service_usage where key = 'call:' || p_user::text for update;
  if usage.window_start <= moment - interval '1 minute' then
    usage.count := 0; usage.window_start := moment;
  end if;
  if usage.count >= 6 then return false; end if;
  update public.service_usage set count = usage.count + 1, window_start = usage.window_start, last_used = moment where key = 'call:' || p_user::text;
  return true;
end; $$;
revoke all on function public.reserve_call_token(uuid) from public, anon, authenticated;
grant execute on function public.reserve_call_token(uuid) to service_role;
commit;
