# Sitemap: Fusion AI Community Hub

## 1. Public Pages (Guests & Community)
* `/` — Home landing page, featured workflows, trending creators, and platform statistics.
* `/workflows` — Searchable workflow marketplace with filterable categories (Sales, Dev, Marketing).
* `/workflows/[id]` — Detailed workflow view, visual node diagram generator, JSON viewer, and 1-click import button.
* `/qa` — Q&A forum with upvoted solutions, tag filtering, and solved thread indicators.
* `/qa/[id]` — Discussion thread detail page with validated solution pins.
* `/creators/[username]` — Public profile showing creator reputation, earned badges, and published templates.
* `/docs` — Documentation for deep-link imports, JSON schemas, and CLI commands.

## 2. Authenticated User Space
* `/dashboard` — Overview of personal workflows, download analytics, and community upvotes.
* `/workflows/new` — Upload interface for `.json` or `.yaml` workflow configs with real-time payload sanitization.
* `/workflows/[id]/edit` — Version management dashboard to push updates (v1.1, v2.0) or update metadata.
* `/qa/ask` — Question submission portal with code/JSON snippet attachments and tag assignment.
* `/settings/profile` — Account management, custom avatar, bio, and linked GitHub/Google accounts.
* `/settings/api-keys` — API key generator for programmatic workflow uploads and CLI integration.

## 3. Admin & Moderation Space
* `/admin` — High-level platform health metrics, download volumes, and active user counts.
* `/admin/moderation` — Queue for reported workflows, flagged discussions, and sanitization failure logs.
* `/admin/creators` — Review dashboard for verified creator badge requests.

## 4. API & System Routes
* `/api/v1/import/[id]` — Deep-link handler executing direct imports into the local Fusion AI desktop/web app.
* `/api/v1/workflows/parse` — Backend worker route parsing, validating, and stripping sensitive credentials from uploaded payloads.
* `/api/v1/search` — High-performance endpoint querying workflows, posts, and tags.