import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ApiKeysManager } from "@/components/settings/api-keys-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "API Keys" };

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: keys } = await supabase
    .from("api_keys")
    .select("*")
    .eq("owner_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="API keys" description="For programmatic workflow uploads and CLI integration." />
      <ApiKeysManager initialKeys={keys ?? []} />
    </div>
  );
}
