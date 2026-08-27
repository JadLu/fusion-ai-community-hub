import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowUploadForm } from "@/components/workflows/workflow-upload-form";

export const metadata: Metadata = { title: "Upload Workflow" };

export default function NewWorkflowPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Upload a workflow"
        description="Credentials are stripped automatically before anything is stored — see the redaction report after upload."
      />
      <WorkflowUploadForm />
    </div>
  );
}
