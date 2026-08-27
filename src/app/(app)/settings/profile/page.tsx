import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile Settings" };

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile settings" description="Manage your public profile." />
      <ProfileForm profile={profile} />
    </div>
  );
}
