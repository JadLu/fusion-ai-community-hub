-- Fusion AI Community Hub — initial schema
-- Tables: profiles, workflows (+ versions), qa_posts (+ replies), reputation_badges,
-- plus api_keys and moderation_reports to support the settings and admin route tiers.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 32),
  display_name text not null,
  avatar_url text,
  bio text,
  github_url text,
  google_linked boolean not null default false,
  reputation integer not null default 0,
  role text not null default 'member' check (role in ('member', 'creator', 'admin')),
  verified_creator boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- ---------------------------------------------------------------------------
-- reputation_badges (catalog) + profile_badges (earned, join table)
-- ---------------------------------------------------------------------------
create table if not exists public.reputation_badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  icon text not null,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum'))
);

create table if not exists public.profile_badges (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.reputation_badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (profile_id, badge_id)
);

-- ---------------------------------------------------------------------------
-- workflows + workflow_versions
-- ---------------------------------------------------------------------------
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  slug text unique not null,
  description text not null default '',
  category text not null,
  tags text[] not null default '{}',
  json_schema jsonb not null,
  version text not null default 'v1.0',
  downloads integer not null default 0,
  upvotes integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published', 'flagged', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflows_owner_idx on public.workflows (owner_id);
create index if not exists workflows_category_idx on public.workflows (category);
create index if not exists workflows_status_idx on public.workflows (status);
create index if not exists workflows_tags_idx on public.workflows using gin (tags);

create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  version text not null,
  changelog text,
  json_schema jsonb not null,
  created_at timestamptz not null default now(),
  unique (workflow_id, version)
);

-- ---------------------------------------------------------------------------
-- qa_posts + qa_replies
-- ---------------------------------------------------------------------------
create table if not exists public.qa_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 200),
  body text not null,
  tags text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'solved')),
  upvotes integer not null default 0,
  accepted_reply_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists qa_posts_status_idx on public.qa_posts (status);
create index if not exists qa_posts_tags_idx on public.qa_posts using gin (tags);

create table if not exists public.qa_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.qa_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  upvotes integer not null default 0,
  is_solution boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.qa_posts
  add constraint qa_posts_accepted_reply_fkey
  foreign key (accepted_reply_id) references public.qa_replies (id) on delete set null;

create index if not exists qa_replies_post_idx on public.qa_replies (post_id);

-- ---------------------------------------------------------------------------
-- api_keys (settings/api-keys)
-- ---------------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists api_keys_owner_idx on public.api_keys (owner_id);

-- ---------------------------------------------------------------------------
-- moderation_reports (admin/moderation queue)
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('workflow', 'qa_post', 'qa_reply')),
  target_id uuid not null,
  reason text not null,
  reported_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists moderation_reports_status_idx on public.moderation_reports (status);

-- ---------------------------------------------------------------------------
-- updated_at trigger for workflows
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.reputation_badges enable row level security;
alter table public.profile_badges enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_versions enable row level security;
alter table public.qa_posts enable row level security;
alter table public.qa_replies enable row level security;
alter table public.api_keys enable row level security;
alter table public.moderation_reports enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: publicly readable, self-editable, admins can moderate any row.
create policy "profiles are publicly readable" on public.profiles
  for select using (true);
create policy "users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- reputation_badges: public catalog, admin-managed.
create policy "badges are publicly readable" on public.reputation_badges
  for select using (true);
create policy "admins manage badges" on public.reputation_badges
  for all using (public.is_admin()) with check (public.is_admin());

create policy "profile badges are publicly readable" on public.profile_badges
  for select using (true);
create policy "admins award badges" on public.profile_badges
  for all using (public.is_admin()) with check (public.is_admin());

-- workflows: published rows are public; owners manage their own; admins manage all.
create policy "published workflows are publicly readable" on public.workflows
  for select using (status = 'published' or owner_id = auth.uid() or public.is_admin());
create policy "owners insert workflows" on public.workflows
  for insert with check (owner_id = auth.uid());
create policy "owners update their workflows" on public.workflows
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "owners delete their workflows" on public.workflows
  for delete using (owner_id = auth.uid() or public.is_admin());

create policy "workflow versions follow workflow visibility" on public.workflow_versions
  for select using (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_id
        and (w.status = 'published' or w.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "owners insert workflow versions" on public.workflow_versions
  for insert with check (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_id and w.owner_id = auth.uid()
    )
  );

-- qa_posts / qa_replies: publicly readable, author-editable, admins moderate.
create policy "qa posts are publicly readable" on public.qa_posts
  for select using (true);
create policy "authenticated users create qa posts" on public.qa_posts
  for insert with check (author_id = auth.uid());
create policy "authors update their qa posts" on public.qa_posts
  for update using (author_id = auth.uid() or public.is_admin());
create policy "authors delete their qa posts" on public.qa_posts
  for delete using (author_id = auth.uid() or public.is_admin());

create policy "qa replies are publicly readable" on public.qa_replies
  for select using (true);
create policy "authenticated users create qa replies" on public.qa_replies
  for insert with check (author_id = auth.uid());
create policy "authors update their qa replies" on public.qa_replies
  for update using (author_id = auth.uid() or public.is_admin());
create policy "authors delete their qa replies" on public.qa_replies
  for delete using (author_id = auth.uid() or public.is_admin());

-- api_keys: strictly private to the owner.
create policy "owners manage their api keys" on public.api_keys
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- moderation_reports: reporters can create; only admins can read/resolve the queue.
create policy "authenticated users file reports" on public.moderation_reports
  for insert with check (reported_by = auth.uid());
create policy "admins read reports" on public.moderation_reports
  for select using (public.is_admin());
create policy "admins resolve reports" on public.moderation_reports
  for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed: badge catalog
-- ---------------------------------------------------------------------------
insert into public.reputation_badges (slug, name, description, icon, tier)
values
  ('early-adopter', 'Early Adopter', 'Joined during the platform''s early access period.', 'sparkles', 'bronze'),
  ('first-workflow', 'First Workflow', 'Published their first automation workflow.', 'rocket', 'bronze'),
  ('helpful-answer', 'Helpful Answer', 'Had a Q&A reply accepted as the solution.', 'lightbulb', 'silver'),
  ('top-creator', 'Top Creator', 'Workflow downloaded 1,000+ times.', 'trophy', 'gold'),
  ('verified-creator', 'Verified Creator', 'Identity and workflow quality verified by the Fusion AI team.', 'badge-check', 'platinum')
on conflict (slug) do nothing;
