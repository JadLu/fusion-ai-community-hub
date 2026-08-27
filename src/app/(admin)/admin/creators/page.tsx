import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CreatorRequestsQueue } from "@/components/admin/creator-requests-queue";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Creator Requests" };

export default async function AdminCreatorsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, reputation")
    .eq("role", "creator")
    .eq("verified_creator", false)
    .order("reputation", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Creator requests" description="Review dashboard for verified creator badge requests." />
      <CreatorRequestsQueue initialRequests={requests ?? []} />
    </div>
  );
}
