begin;
create table public.account_settings (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 font double precision not null default 1 check(font in (1,1.15,1.3)),
 dark boolean not null default false,
 notifications boolean not null default true,
 autoplay boolean not null default false
);
alter table public.account_settings enable row level security;
create policy settings_own on public.account_settings for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.account_settings to authenticated;
revoke all on public.account_settings from anon;
create table public.artwork_likes (
 user_id uuid not null references public.profiles(id) on delete cascade,
 artwork_id uuid not null references public.artworks(id) on delete cascade,
 primary key(user_id,artwork_id)
);
alter table public.artwork_likes enable row level security;
create policy likes_read on public.artwork_likes for select to authenticated using(user_id=auth.uid());
create policy likes_insert on public.artwork_likes for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.artworks a where a.id=artwork_id and a.group_id=public.my_group()));
create policy likes_delete on public.artwork_likes for delete to authenticated using(user_id=auth.uid());
grant select,insert,delete on public.artwork_likes to authenticated;
revoke all on public.artwork_likes from anon;
create index likes_artwork_idx on public.artwork_likes(artwork_id);
create index meetings_group_starts_idx on public.meetings(group_id,starts_at);
create index comments_created_idx on public.comments(created_at desc);
commit;
