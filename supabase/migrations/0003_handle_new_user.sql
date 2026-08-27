-- Fusion AI Community Hub — auto-provision a profile row on signup
--
-- 0001_init.sql's `profiles` row is required by every downstream query
-- (get-session-profile.ts, and RLS checks like `owner_id = auth.uid()`), but
-- nothing creates it — the signup UI only calls supabase.auth.signUp(). This
-- trigger fills that gap so a fresh account is immediately usable.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
  meta_name text;
begin
  meta_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');

  -- Derive a username from the email local-part: lowercase, keep [a-z0-9_],
  -- clamp to the 3..32 length the profiles CHECK constraint requires.
  base_username := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g');
  if char_length(base_username) < 3 then
    base_username := 'user' || base_username;
  end if;
  base_username := left(base_username, 28);

  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_username, 24) || '-' || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, coalesce(meta_name, candidate))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profiles for any existing auth users that lack one.
insert into public.profiles (id, username, display_name)
select
  u.id,
  left(
    coalesce(
      nullif(regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''),
      'user'
    ),
    28
  ) || '-' || left(u.id::text, 4),
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
