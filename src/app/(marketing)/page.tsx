import Link from "next/link";
import { ArrowRight, Download, MessagesSquare, PackageSearch, Users, Workflow as WorkflowIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowCard } from "@/components/shared/workflow-card";
import { CreatorCard } from "@/components/shared/creator-card";
import { EmptyState } from "@/components/shared/empty-state";
import { CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import type { CreatorProfile, WorkflowWithCreator } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ count: memberCount }, { data: downloadRows }, { count: solvedCount }, { data: featuredRows }, { data: creatorRows }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("workflows").select("downloads").eq("status", "published"),
      supabase.from("qa_posts").select("*", { count: "exact", head: true }).eq("status", "solved"),
      supabase
        .from("workflows")
        .select("*, creator:profiles!workflows_owner_id_fkey(username, display_name, avatar_url, verified_creator)")
        .eq("status", "published")
        .order("downloads", { ascending: false })
        .limit(6),
      supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, bio, github_url, google_linked, reputation, role, verified_creator, created_at, workflows!workflows_owner_id_fkey(count)",
        )
        .order("reputation", { ascending: false })
        .limit(4),
    ]);

  const workflowCount = (downloadRows ?? []).length;
  const totalDownloads = (downloadRows ?? []).reduce((sum, w) => sum + w.downloads, 0);

  const STATS = [
    { label: "Workflows published", value: workflowCount.toLocaleString(), icon: WorkflowIcon },
    { label: "Total imports", value: totalDownloads.toLocaleString(), icon: Download },
    { label: "Community members", value: (memberCount ?? 0).toLocaleString(), icon: Users },
    { label: "Q&A threads solved", value: (solvedCount ?? 0).toLocaleString(), icon: MessagesSquare },
  ];

  const featured = (featuredRows ?? []) as WorkflowWithCreator[];
  const creators: CreatorProfile[] = (creatorRows ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    github_url: row.github_url,
    google_linked: row.google_linked,
    reputation: row.reputation,
    role: row.role,
    verified_creator: row.verified_creator,
    created_at: row.created_at,
    badges: [],
    workflow_count: (row.workflows as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
        <div className="container flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-1.5">
              <Link href="/workflows">
                Browse workflows <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/workflows/new">Publish a workflow</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-10">
        <div className="container grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-platform-blue/10 text-platform-blue">
                <stat.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-14">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/workflows?category=${category}`}
              className="category-label rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {category}
            </Link>
          ))}
        </div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Featured workflows</h2>
          <Button asChild variant="link" className="gap-1 text-sm">
            <Link href="/workflows">
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
        {featured.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No workflows published yet"
            description="Be the first to share a workflow with the community."
            action={
              <Button asChild size="sm" className="mt-1">
                <Link href="/workflows/new">Publish a workflow</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-border bg-secondary/20 py-14">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Trending creators</h2>
            <Button asChild variant="link" className="gap-1 text-sm">
              <Link href="/qa">
                Ask the community <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
          {creators.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No creators yet — sign up and publish the first workflow.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {creators.map((creator) => (
                <CreatorCard key={creator.username} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
