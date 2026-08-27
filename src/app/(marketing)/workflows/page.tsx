import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { WorkflowCard } from "@/components/shared/workflow-card";
import { WorkflowFilters } from "@/components/shared/workflow-filters";
import { createClient } from "@/lib/supabase/server";
import type { WorkflowWithCreator } from "@/lib/types";

export const metadata: Metadata = { title: "Workflow Marketplace" };

const SORT_COLUMN: Record<string, "downloads" | "upvotes" | "created_at"> = {
  downloads: "downloads",
  upvotes: "upvotes",
  newest: "created_at",
  trending: "upvotes",
};

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q = "", category = "", sort = "trending" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("workflows")
    .select("*, creator:profiles!workflows_owner_id_fkey(username, display_name, avatar_url, verified_creator)")
    .eq("status", "published");

  if (q) {
    query = query.or(`title.ilike.%${q}%,tags.cs.{${q}}`);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data } = await query
    .order(SORT_COLUMN[sort] ?? "upvotes", { ascending: false })
    .limit(60);

  const results = (data ?? []) as WorkflowWithCreator[];

  return (
    <div className="container py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Workflow Marketplace</h1>
        <p className="text-sm text-muted-foreground">Sales, Dev, Marketing, Support, Ops, and Data workflows.</p>
      </div>

      <div className="mb-8">
        <WorkflowFilters defaultQuery={q} defaultCategory={category} defaultSort={sort} />
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <PackageSearch className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No workflows match your filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different search term or clear the category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      )}
    </div>
  );
}
