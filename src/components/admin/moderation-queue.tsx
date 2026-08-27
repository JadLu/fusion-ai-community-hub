"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { resolveReport } from "@/lib/actions/moderation";
import type { ModerationTargetType } from "@/lib/supabase/database.types";

export interface EnrichedReport {
  id: string;
  target_type: ModerationTargetType;
  target_title: string;
  reason: string;
  reporter_name: string;
  created_at: string;
}

const TYPE_LABEL: Record<ModerationTargetType, string> = {
  workflow: "Workflow",
  qa_post: "Q&A Post",
  qa_reply: "Q&A Reply",
};

export function ModerationQueue({ initialReports }: { initialReports: EnrichedReport[] }) {
  const [reports, setReports] = React.useState(initialReports);
  const [pending, setPending] = React.useState<string | null>(null);

  async function handle(id: string, status: "resolved" | "dismissed") {
    setPending(id);
    const res = await resolveReport(id, status);
    setPending(null);
    if (!res.ok) {
      toast.error(res.error ?? "Could not update report.");
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success(status === "resolved" ? "Report resolved." : "Report dismissed.");
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Queue is clear"
        description="No pending reports — flagged workflows and discussions will show up here."
      />
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {reports.map((report) => (
        <div key={report.id} className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {TYPE_LABEL[report.target_type]}
              </Badge>
              <span className="truncate text-sm font-medium">{report.target_title}</span>
            </div>
            <p className="text-sm text-muted-foreground">{report.reason}</p>
            <p className="text-xs text-muted-foreground">
              Reported by {report.reporter_name} · {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={pending === report.id}
              onClick={() => handle(report.id, "dismissed")}
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Dismiss
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={pending === report.id}
              onClick={() => handle(report.id, "resolved")}
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> Resolve
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
