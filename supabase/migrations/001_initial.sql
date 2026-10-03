-- Run once in a new Supabase project. Provision groups/therapists using a trusted SQL console.
begin;
create table public.groups (id uuid primary key default gen_random_uuid(), name text not null);
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'هنرمند عزیز',
  role text not null default 'participant' check (role in ('participant', 'therapist')),
  group_id uuid references public.groups
);
create function public.create_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(nullif(left(new.raw_user_meta_data->>'display_name', 100), ''), 'هنرمند عزیز'));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile();
create function public.my_group() returns uuid language sql stable security definer set search_path = public as $$ select group_id from public.profiles where id = auth.uid(); $$;
create function public.is_therapist() returns boolean language sql stable security definer set search_path = public as $$ select coalesce((select role = 'therapist' from public.profiles where id = auth.uid()), false); $$;
revoke all on function public.my_group(), public.is_therapist() from public;
grant execute on function public.my_group(), public.is_therapist() to authenticated;
create table public.artworks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
  group_id uuid not null references public.groups, lesson_id integer not null check (lesson_id between 1 and 12),
  title text not null check (length(title) between 1 and 100), story text not null default '' check (length(story) <= 3000),
  image_path text not null, audio_path text, created_at timestamptz not null default now()
);
create table public.progress (
  user_id uuid not null references public.profiles on delete cascade, lesson_id integer not null check (lesson_id between 1 and 12),
  completed_at timestamptz not null default now(), primary key (user_id, lesson_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(), artwork_id uuid not null references public.artworks on delete cascade,
  user_id uuid not null references public.profiles on delete cascade, body text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create table public.meetings (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups,
  after_lesson integer not null check (after_lesson in (2,4,6,8,10,12)), starts_at timestamptz not null,
  url text not null check (url ~ '^https://[^[:space:]]+$'), unique (group_id, after_lesson)
);
create table public.lesson_content (
  group_id uuid not null references public.groups, lesson_id integer not null check (lesson_id between 1 and 12),
  video_url text check (video_url ~ '^https://[^[:space:]]+$'), primary key (group_id, lesson_id)
);
create index artworks_group on public.artworks(group_id, created_at desc);
create index comments_artwork on public.comments(artwork_id);
create index profiles_group on public.profiles(group_id);
create function public.validate_progress() returns trigger language plpgsql set search_path = public as $$
begin
  if new.lesson_id > 1 and not exists (select 1 from public.progress where user_id = new.user_id and lesson_id = new.lesson_id - 1) then raise exception 'Previous session must be completed'; end if;
  if not exists (select 1 from public.artworks where user_id = new.user_id and lesson_id = new.lesson_id) then raise exception 'An artwork is required'; end if;
  return new;
end; $$;
create trigger validate_progress before insert or update on public.progress for each row execute procedure public.validate_progress();
alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.artworks enable row level security;
alter table public.progress enable row level security;
alter table public.comments enable row level security;
alter table public.meetings enable row level security;
alter table public.lesson_content enable row level security;
create policy group_read on public.groups for select to authenticated using (id = public.my_group());
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or group_id = public.my_group());
-- No client INSERT/UPDATE policies on profiles: clients cannot grant themselves roles or group membership.
create policy artwork_read on public.artworks for select to authenticated using (group_id = public.my_group());
create policy artwork_insert on public.artworks for insert to authenticated with check (
  user_id = auth.uid() and group_id = public.my_group()
  and split_part(image_path, '/', 1) = auth.uid()::text
  and (audio_path is null or split_part(audio_path, '/', 1) = auth.uid()::text)
  and (lesson_id = 1 or exists (select 1 from public.progress p where p.user_id = auth.uid() and p.lesson_id = artworks.lesson_id - 1))
);
create policy progress_read on public.progress for select to authenticated using (user_id = auth.uid() or (public.is_therapist() and exists (select 1 from public.profiles p where p.id = progress.user_id and p.group_id = public.my_group())));
create policy progress_insert on public.progress for insert to authenticated with check (user_id = auth.uid());
create policy progress_update on public.progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy comment_read on public.comments for select to authenticated using (exists (select 1 from public.artworks a where a.id = artwork_id and a.group_id = public.my_group()));
create policy comment_insert on public.comments for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.artworks a where a.id = artwork_id and a.group_id = public.my_group()));
create policy meeting_read on public.meetings for select to authenticated using (group_id = public.my_group());
create policy meeting_insert on public.meetings for insert to authenticated with check (public.is_therapist() and group_id = public.my_group());
create policy meeting_update on public.meetings for update to authenticated using (public.is_therapist() and group_id = public.my_group()) with check (public.is_therapist() and group_id = public.my_group());
create policy content_read on public.lesson_content for select to authenticated using (group_id = public.my_group());
create policy content_insert on public.lesson_content for insert to authenticated with check (public.is_therapist() and group_id = public.my_group());
create policy content_update on public.lesson_content for update to authenticated using (public.is_therapist() and group_id = public.my_group()) with check (public.is_therapist() and group_id = public.my_group());
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('artworks', 'artworks', false, 10485760, array['image/jpeg','image/png','image/webp','audio/mp4','audio/webm','audio/m4a']) on conflict (id) do nothing;
create policy storage_upload on storage.objects for insert to authenticated with check (bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text and public.my_group() is not null);
create policy storage_read on storage.objects for select to authenticated using (bucket_id = 'artworks' and ((storage.foldername(name))[1] = auth.uid()::text or exists (select 1 from public.artworks a where a.group_id = public.my_group() and (a.image_path = name or a.audio_path = name))));
commit;
