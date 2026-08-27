import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QaThreadCard } from "@/components/shared/qa-thread-card";
import { QaFilters } from "@/components/shared/qa-filters";
import { createClient } from "@/lib/supabase/server";
import type { QaPostStatus } from "@/lib/supabase/database.types";
import type { QaPostWithAuthor } from "@/lib/types";

export const metadata: Metadata = { title: "Q&A Forum" };

export default async function QaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("qa_posts")
    .select("*, author:profiles(username, display_name, avatar_url), replies:qa_replies!qa_replies_post_id_fkey(count)");

  if (q) {
    query = query.or(`title.ilike.%${q}%,tags.cs.{${q}}`);
  }
  if (status === "open" || status === "solved") {
    query = query.eq("status", status satisfies QaPostStatus);
  }

  const { data } = await query.order("created_at", { ascending: false }).limit(60);

  const results: QaPostWithAuthor[] = (data ?? []).map((row) => ({
    ...row,
    reply_count: (row.replies as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Q&amp;A Forum</h1>
          <p className="text-sm text-muted-foreground">
            Ask about workflow configuration, sanitization, imports, and the platform API.
          </p>
        </div>
        <Button asChild className="gap-1.5 shrink-0">
          <Link href="/qa/ask">
            <Plus className="h-4 w-4" aria-hidden /> Ask a question
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <QaFilters defaultQuery={q} defaultStatus={status} />
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <MessageSquareOff className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No threads match your filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Be the first to ask — the community usually replies within a day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((post) => (
            <QaThreadCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
