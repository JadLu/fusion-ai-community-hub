-- Fusion AI Community Hub — engagement schema
-- Adds the tables the Hub's community layer needs on top of 0001_init.sql:
--   workflow_comments, votes, workflow_downloads, bookmarks.
-- Reuses public.is_admin() and public.set_updated_at() from 0001_init.sql.

-- ---------------------------------------------------------------------------
-- workflow_comments — threaded (one level) discussion on a workflow
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_comments (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.workflow_comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflow_comments_workflow_idx on public.workflow_comments (workflow_id);
create index if not exists workflow_comments_parent_idx on public.workflow_comments (parent_id);

drop trigger if exists workflow_comments_set_updated_at on public.workflow_comments;
create trigger workflow_comments_set_updated_at
  before update on public.workflow_comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- votes — one row per (target, user); maintains the denormalized upvote
-- counters on workflows / qa_posts / qa_replies via trigger.
-- ---------------------------------------------------------------------------
create table if not exists public.votes (
  target_type text not null check (target_type in ('workflow', 'qa_post', 'qa_reply')),
  target_id uuid not null,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  primary key (target_type, target_id, voter_id)
);

create index if not exists votes_target_idx on public.votes (target_type, target_id);
create index if not exists votes_voter_idx on public.votes (voter_id);

-- Keeps <table>.upvotes equal to the sum of vote values for that row.
create or replace function public.sync_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_type text;
  t_id uuid;
  delta integer;
begin
  if (tg_op = 'DELETE') then
    t_type := old.target_type;
    t_id := old.target_id;
    delta := -old.value;
  elsif (tg_op = 'UPDATE') then
    t_type := new.target_type;
    t_id := new.target_id;
    delta := new.value - old.value;
  else
    t_type := new.target_type;
    t_id := new.target_id;
    delta := new.value;
  end if;

  if delta <> 0 then
    if t_type = 'workflow' then
      update public.workflows set upvotes = upvotes + delta where id = t_id;
    elsif t_type = 'qa_post' then
      update public.qa_posts set upvotes = upvotes + delta where id = t_id;
    elsif t_type = 'qa_reply' then
      update public.qa_replies set upvotes = upvotes + delta where id = t_id;
    end if;
  end if;

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists votes_sync_count on public.votes;
create trigger votes_sync_count
  after insert or update or delete on public.votes
  for each row execute function public.sync_vote_count();

-- ---------------------------------------------------------------------------
-- workflow_downloads — records each import; bumps workflows.downloads.
-- user_id is nullable so anonymous deep-link imports can still be logged.
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_downloads (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists workflow_downloads_workflow_idx on public.workflow_downloads (workflow_id);
create index if not exists workflow_downloads_user_idx on public.workflow_downloads (user_id);

create or replace function public.bump_download_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workflows set downloads = downloads + 1 where id = new.workflow_id;
  return new;
end;
$$;

drop trigger if exists workflow_downloads_bump on public.workflow_downloads;
create trigger workflow_downloads_bump
  after insert on public.workflow_downloads
  for each row execute function public.bump_download_count();

-- ---------------------------------------------------------------------------
-- bookmarks — a user's saved workflows.
-- ---------------------------------------------------------------------------
create table if not exists public.bookmarks (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, workflow_id)
);

create index if not exists bookmarks_workflow_idx on public.bookmarks (workflow_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.workflow_comments enable row level security;
alter table public.votes enable row level security;
alter table public.workflow_downloads enable row level security;
alter table public.bookmarks enable row level security;

-- workflow_comments: publicly readable, author-editable, admins moderate.
create policy "workflow comments are publicly readable" on public.workflow_comments
  for select using (true);
create policy "authenticated users create workflow comments" on public.workflow_comments
  for insert with check (author_id = auth.uid());
create policy "authors update their workflow comments" on public.workflow_comments
  for update using (author_id = auth.uid() or public.is_admin());
create policy "authors delete their workflow comments" on public.workflow_comments
  for delete using (author_id = auth.uid() or public.is_admin());

-- votes: counts are public; a user only touches their own vote rows.
create policy "votes are publicly readable" on public.votes
  for select using (true);
create policy "users cast their own votes" on public.votes
  for insert with check (voter_id = auth.uid());
create policy "users change their own votes" on public.votes
  for update using (voter_id = auth.uid()) with check (voter_id = auth.uid());
create policy "users remove their own votes" on public.votes
  for delete using (voter_id = auth.uid());

-- workflow_downloads: a user files their own download; reads are limited to
-- the downloader, the workflow owner, and admins. Anonymous imports are logged
-- server-side with the service role (which bypasses RLS).
create policy "users log their own downloads" on public.workflow_downloads
  for insert with check (user_id = auth.uid());
create policy "downloads visible to downloader, owner, admin" on public.workflow_downloads
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.workflows w
      where w.id = workflow_id and w.owner_id = auth.uid()
    )
  );

-- bookmarks: strictly private to the owner.
create policy "users manage their own bookmarks" on public.bookmarks
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
