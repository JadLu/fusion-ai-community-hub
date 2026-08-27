import type { Metadata } from "next";
import { BadgeCheck, Download, ShieldAlert, Users, Workflow as WorkflowIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: workflowCount },
    { data: downloadRows },
    { count: pendingReports },
    { count: pendingCreators },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("workflows").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("workflows").select("downloads"),
    supabase.from("moderation_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "creator").eq("verified_creator", false),
  ]);

  const totalDownloads = (downloadRows ?? []).reduce((sum, w) => sum + w.downloads, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Admin overview" description="Platform health at a glance." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Community Members" value={userCount ?? 0} icon={Users} accent="text-platform-blue" />
        <StatTile label="Published Workflows" value={workflowCount ?? 0} icon={WorkflowIcon} accent="text-platform-purple" />
        <StatTile label="Total Downloads" value={totalDownloads.toLocaleString()} icon={Download} accent="text-platform-orange" />
        <StatTile
          label="Pending Reports"
          value={pendingReports ?? 0}
          icon={ShieldAlert}
          accent="text-platform-rose"
          trend={pendingReports ? "Needs review" : "All clear"}
        />
        <StatTile
          label="Creator Requests"
          value={pendingCreators ?? 0}
          icon={BadgeCheck}
          accent="text-platform-pink"
          trend={pendingCreators ? "Awaiting verification" : "None pending"}
        />
      </div>
    </div>
  );
}
