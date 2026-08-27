import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, Download, ArrowUp, Clock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryBadge } from "@/components/shared/category-badge";
import { WorkflowNodeDiagram } from "@/components/shared/workflow-node-diagram";
import { JsonViewer } from "@/components/shared/json-viewer";
import { ImportButton } from "@/components/shared/import-button";
import { createClient } from "@/lib/supabase/server";
import { deriveNodePreview } from "@/lib/workflow-nodes";
import type { WorkflowWithCreator } from "@/lib/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

async function getWorkflow(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workflows")
    .select("*, creator:profiles!workflows_owner_id_fkey(username, display_name, avatar_url, verified_creator)")
    .eq("id", id)
    .maybeSingle();
  return data as WorkflowWithCreator | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const workflow = await getWorkflow(id);
  return { title: workflow?.title ?? "Workflow" };
}

export default async function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = await getWorkflow(id);
  if (!workflow) notFound();

  const supabase = await createClient();
  const { data: versions } = await supabase
    .from("workflow_versions")
    .select("version, changelog, created_at")
    .eq("workflow_id", workflow.id)
    .order("created_at", { ascending: false });

  const nodes = deriveNodePreview(workflow.json_schema);

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={workflow.category} />
          <span className="text-xs font-medium text-muted-foreground">{workflow.version}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{workflow.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{workflow.description}</p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-6">
            <Link
              href={`/creators/${workflow.creator.username}`}
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials(workflow.creator.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="flex items-center gap-1 text-sm font-medium">
                {workflow.creator.display_name}
                {workflow.creator.verified_creator && (
                  <BadgeCheck className="h-3.5 w-3.5 text-platform-blue" aria-label="Verified creator" />
                )}
              </span>
            </Link>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Download className="h-4 w-4" aria-hidden /> {workflow.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowUp className="h-4 w-4" aria-hidden /> {workflow.upvotes.toLocaleString()}
            </span>
            <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
              <Clock className="h-4 w-4" aria-hidden />
              Updated {new Date(workflow.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <ImportButton workflowId={workflow.id} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold">Node diagram</h2>
            {nodes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No node preview available for this workflow.
              </p>
            ) : (
              <WorkflowNodeDiagram nodes={nodes} />
            )}
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold">Tags</h2>
            <div className="flex flex-wrap gap-1.5">
              {workflow.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden />
            Have a question about setting this up?{" "}
            <Button asChild variant="link" className="h-auto p-0 text-sm">
              <Link href={`/qa/ask?workflow=${workflow.id}`}>Ask the community</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="json">
          <JsonViewer data={workflow.json_schema} filename={`${workflow.slug}.json`} />
        </TabsContent>

        <TabsContent value="versions">
          {!versions || versions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              No version history yet — this is the initial publish ({workflow.version}).
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {versions.map((v) => (
                <li key={v.version} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold">{v.version}</p>
                    <p className="text-xs text-muted-foreground">{v.changelog ?? "No changelog provided."}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
