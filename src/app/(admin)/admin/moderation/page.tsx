import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ModerationQueue, type EnrichedReport } from "@/components/admin/moderation-queue";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Moderation Queue" };

export default async function ModerationPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("moderation_reports")
    .select("id, target_type, target_id, reason, reported_by, created_at, status")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const list = reports ?? [];
  const workflowIds = list.filter((r) => r.target_type === "workflow").map((r) => r.target_id);
  const qaPostIds = list.filter((r) => r.target_type === "qa_post").map((r) => r.target_id);
  const qaReplyIds = list.filter((r) => r.target_type === "qa_reply").map((r) => r.target_id);
  const reporterIds = Array.from(new Set(list.map((r) => r.reported_by)));

  const [{ data: workflows }, { data: qaPosts }, { data: qaReplies }, { data: reporters }] = await Promise.all([
    workflowIds.length
      ? supabase.from("workflows").select("id, title").in("id", workflowIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    qaPostIds.length
      ? supabase.from("qa_posts").select("id, title").in("id", qaPostIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    qaReplyIds.length
      ? supabase.from("qa_replies").select("id, body").in("id", qaReplyIds)
      : Promise.resolve({ data: [] as { id: string; body: string }[] }),
    reporterIds.length
      ? supabase.from("profiles").select("id, display_name").in("id", reporterIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ]);

  const titleFor = (report: (typeof list)[number]) => {
    if (report.target_type === "workflow") {
      return workflows?.find((w) => w.id === report.target_id)?.title ?? "Deleted workflow";
    }
    if (report.target_type === "qa_post") {
      return qaPosts?.find((p) => p.id === report.target_id)?.title ?? "Deleted post";
    }
    return qaReplies?.find((r) => r.id === report.target_id)?.body.slice(0, 60) ?? "Deleted reply";
  };

  const enriched: EnrichedReport[] = list.map((report) => ({
    id: report.id,
    target_type: report.target_type,
    target_title: titleFor(report),
    reason: report.reason,
    reporter_name: reporters?.find((p) => p.id === report.reported_by)?.display_name ?? "Unknown",
    created_at: report.created_at,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Moderation queue" description="Reported workflows, flagged discussions, and sanitization failures." />
      <ModerationQueue initialReports={enriched} />
    </div>
  );
}
