import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

interface SearchResult {
  type: "workflow" | "qa_post" | "creator";
  id: string;
  title: string;
  snippet: string;
  href: string;
}

const RESULT_LIMIT = 8;

/**
 * High-performance search across workflows, Q&A posts, and creators.
 * GET /api/v1/search?q=...&type=workflow|qa_post|creator (type optional).
 *
 * Uses Postgres full-text/trigram matching via `ilike` on indexed columns.
 * Falls back to an empty result set (rather than erroring) when Supabase
 * isn't configured, so the search bar degrades gracefully in dev.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type");

  if (q.length < 2) {
    return NextResponse.json({ ok: true, query: q, results: [] });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, query: q, results: [], warning: "Supabase not configured." });
  }

  const supabase = await createClient();
  const results: SearchResult[] = [];
  const like = `%${q}%`;

  if (!type || type === "workflow") {
    const { data } = await supabase
      .from("workflows")
      .select("id, title, description, slug")
      .eq("status", "published")
      .or(`title.ilike.${like},description.ilike.${like}`)
      .limit(RESULT_LIMIT);

    for (const row of data ?? []) {
      results.push({
        type: "workflow",
        id: row.id,
        title: row.title,
        snippet: row.description.slice(0, 140),
        href: `/workflows/${row.id}`,
      });
    }
  }

  if (!type || type === "qa_post") {
    const { data } = await supabase
      .from("qa_posts")
      .select("id, title, body")
      .or(`title.ilike.${like},body.ilike.${like}`)
      .limit(RESULT_LIMIT);

    for (const row of data ?? []) {
      results.push({
        type: "qa_post",
        id: row.id,
        title: row.title,
        snippet: row.body.slice(0, 140),
        href: `/qa/${row.id}`,
      });
    }
  }

  if (!type || type === "creator") {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, bio")
      .or(`username.ilike.${like},display_name.ilike.${like}`)
      .limit(RESULT_LIMIT);

    for (const row of data ?? []) {
      results.push({
        type: "creator",
        id: row.id,
        title: row.display_name,
        snippet: row.bio?.slice(0, 140) ?? `@${row.username}`,
        href: `/creators/${row.username}`,
      });
    }
  }

  return NextResponse.json({ ok: true, query: q, results: results.slice(0, RESULT_LIMIT) });
}
