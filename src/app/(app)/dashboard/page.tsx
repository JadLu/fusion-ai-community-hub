import type { Metadata } from "next";
import Link from "next/link";
import { Download, ArrowUp, MessagesSquare, Workflow as WorkflowIcon, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryBadge } from "@/components/shared/category-badge";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: workflows }, { data: qaPosts }] = await Promise.all([
    supabase
      .from("workflows")
      .select("id, title, category, version, downloads, upvotes, status, updated_at")
      .eq("owner_id", user?.id ?? "")
      .order("updated_at", { ascending: false }),
    supabase
      .from("qa_posts")
      .select("id, title, status, upvotes, created_at")
      .eq("author_id", user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalDownloads = (workflows ?? []).reduce((sum, w) => sum + w.downloads, 0);
  const totalUpvotes = (workflows ?? []).reduce((sum, w) => sum + w.upvotes, 0);
  const openQuestions = (qaPosts ?? []).filter((p) => p.status === "open").length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dashboard"
        description="An overview of your published workflows, downloads, and community activity."
        actions={
          <Button asChild className="gap-1.5">
            <Link href="/workflows/new">
              <Plus className="h-4 w-4" aria-hidden /> Upload workflow
            </Link>
          </Button>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Published Workflows" value={workflows?.length ?? 0} icon={WorkflowIcon} accent="text-platform-blue" />
        <StatTile label="Total Downloads" value={totalDownloads.toLocaleString()} icon={Download} accent="text-platform-orange" />
        <StatTile label="Total Upvotes" value={totalUpvotes.toLocaleString()} icon={ArrowUp} accent="text-platform-purple" />
        <StatTile label="Open Questions" value={openQuestions} icon={MessagesSquare} accent="text-platform-rose" />
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">My workflows</h2>
          <Button asChild variant="link" className="h-auto gap-1 p-0 text-sm">
            <Link href="/workflows">
              Browse marketplace <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
        {!workflows || workflows.length === 0 ? (
          <EmptyState
            icon={WorkflowIcon}
            title="No workflows published yet"
            description="Upload a .json or .yaml workflow config to share it with the community."
            action={
              <Button asChild size="sm" className="mt-1 gap-1.5">
                <Link href="/workflows/new">
                  <Plus className="h-4 w-4" aria-hidden /> Upload your first workflow
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border">
            {workflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}/edit`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryBadge category={workflow.category} />
                  <span className="truncate text-sm font-medium">{workflow.title}</span>
                  {workflow.status !== "published" && (
                    <Badge variant="secondary" className="shrink-0 font-normal capitalize">
                      {workflow.status}
                    </Badge>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground tabular-nums">
                  <span className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" aria-hidden /> {workflow.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden /> {workflow.upvotes}
                  </span>
                  <span>{workflow.version}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">My questions</h2>
          <Button asChild variant="link" className="h-auto gap-1 p-0 text-sm">
            <Link href="/qa/ask">
              Ask a question <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
        {!qaPosts || qaPosts.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No questions asked yet"
            description="Stuck on a node config or import error? The community usually replies within a day."
          />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border">
            {qaPosts.map((post) => (
              <Link
                key={post.id}
                href={`/qa/${post.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/40"
              >
                <span className="truncate text-sm font-medium">{post.title}</span>
                <Badge
                  variant={post.status === "solved" ? "default" : "secondary"}
                  className="shrink-0 font-normal capitalize"
                >
                  {post.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
