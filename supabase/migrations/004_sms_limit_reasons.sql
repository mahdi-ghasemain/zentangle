begin;
-- Preserve counters and global cost ceiling; allow ten attempts per phone per UTC day.
create function public.reserve_sms_v2(p_phone text, p_daily_limit integer default 100)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  moment timestamptz := clock_timestamp();
  day_start timestamptz := date_trunc('day', moment at time zone 'UTC') at time zone 'UTC';
  phone_key text;
  total public.service_usage%rowtype;
  person public.service_usage%rowtype;
begin
  if p_phone is null or p_daily_limit is null or p_phone !~ '^989[0-9]{9}$' or p_daily_limit not between 1 and 10000 then return jsonb_build_object('allowed', false, 'reason', 'configuration'); end if;
  phone_key := 'sms:' || encode(sha256(convert_to(p_phone, 'UTF8')), 'hex');
  -- All callers lock in the same order. Concurrent requests cannot overspend.
  insert into public.service_usage(key, window_start) values ('sms:all', day_start) on conflict do nothing;
  select * into total from public.service_usage where key = 'sms:all' for update;
  insert into public.service_usage(key, window_start) values (phone_key, day_start) on conflict do nothing;
  select * into person from public.service_usage where key = phone_key for update;
  if total.window_start < day_start then total.count := 0; end if;
  if person.window_start < day_start then person.count := 0; end if;
  if total.count >= p_daily_limit then
    return jsonb_build_object('allowed', false, 'reason', 'daily_budget');
  end if;
  if person.count >= 10 then
    return jsonb_build_object('allowed', false, 'reason', 'phone_daily');
  end if;
  if person.last_used > moment - interval '60 seconds' then
    return jsonb_build_object('allowed', false, 'reason', 'cooldown');
  end if;
  update public.service_usage set count = total.count + 1, window_start = day_start, last_used = moment where key = 'sms:all';
  update public.service_usage set count = person.count + 1, window_start = day_start, last_used = moment where key = phone_key;
  return jsonb_build_object('allowed', true);
end; $$;
revoke all on function public.reserve_sms_v2(text, integer) from public, anon, authenticated;
grant execute on function public.reserve_sms_v2(text, integer) to service_role;


commit;
