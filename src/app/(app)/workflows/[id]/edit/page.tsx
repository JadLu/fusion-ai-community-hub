import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowEditForm } from "@/components/workflows/workflow-edit-form";
import { DeleteWorkflowButton } from "@/components/workflows/delete-workflow-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Workflow" };

export default async function EditWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: workflow } = await supabase.from("workflows").select("*").eq("id", id).maybeSingle();

  if (!workflow) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit workflow" description={workflow.title} />
      <WorkflowEditForm workflow={workflow} />
      <div className="mt-8 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div>
          <p className="text-sm font-semibold text-destructive">Danger zone</p>
          <p className="text-xs text-muted-foreground">Permanently delete this workflow and its history.</p>
        </div>
        <DeleteWorkflowButton workflowId={workflow.id} title={workflow.title} />
      </div>
    </div>
  );
}
