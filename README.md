# Fusion AI Community Hub

Community marketplace for Fusion AI automation workflows — browse and 1-click
import workflows, ask questions in the Q&A forum, and publish your own
templates. Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui,
backed by Supabase (Postgres, Auth, RLS).

## Setup

1. Create a Supabase project and copy `.env.example` to `.env.local`, filling
   in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   Project Settings → API.
2. Run the schema migrations against that project in order (SQL Editor, or
   `supabase db push` with the CLI linked):
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) —
     `profiles`, `workflows`, `qa_posts`, `reputation_badges`, and related
     tables, plus their Row Level Security policies.
   - [`supabase/migrations/0002_engagement.sql`](supabase/migrations/0002_engagement.sql) —
     `workflow_comments`, `votes`, `workflow_downloads`, `bookmarks` (+ triggers
     that keep the `upvotes` / `downloads` counters in sync).
   - [`supabase/migrations/0003_handle_new_user.sql`](supabase/migrations/0003_handle_new_user.sql) —
     trigger that auto-creates a `profiles` row when a user signs up.

   After the project is linked, regenerate the TypeScript types from the live
   schema (they replace the hand-authored
   `src/lib/supabase/database.types.ts`):

   ```bash
   npx supabase gen types typescript --project-id <project-id> --schema public > src/lib/supabase/database.types.ts
   ```
3. Authentication is email + password only. In Authentication → Providers,
   make sure the Email provider is enabled (it is by default); no OAuth
   providers are used.
4. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Route map

- **Public**: `/`, `/workflows`, `/workflows/[id]`, `/qa`, `/qa/[id]`,
  `/creators/[username]`, `/docs`, `/login`, `/signup`
- **Authenticated**: `/dashboard`, `/workflows/new`, `/workflows/[id]/edit`,
  `/qa/ask`, `/settings/profile`, `/settings/api-keys`
- **Admin** (requires `profiles.role = 'admin'`): `/admin`,
  `/admin/moderation`, `/admin/creators`
- **API**: `/api/v1/workflows/parse` (credential sanitization),
  `/api/v1/import/[id]` (deep-link import), `/api/v1/search`

Route access is enforced in [`src/middleware.ts`](src/middleware.ts) and, for
the admin tier, again in [`src/app/(admin)/layout.tsx`](<src/app/(admin)/layout.tsx>).

## Notes

- `src/lib/mock-data.ts` seeds the public pages (home, marketplace, Q&A,
  creator profiles) with sample content so the UI has something to render
  before any real workflows exist — swap it for live Supabase queries once
  the project has data.
- Authenticated and admin pages already query Supabase directly and render
  correctly-empty states on a fresh project.
- Promote a user to admin manually until an admin-invite flow exists:
  `update public.profiles set role = 'admin' where username = '...';`
