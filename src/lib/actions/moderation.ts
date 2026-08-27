"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ModerationStatus } from "@/lib/supabase/database.types";

const NOT_CONFIGURED_ERROR = "Connect a Supabase project to enable this — see the README.";

export async function resolveReport(id: string, status: ModerationStatus): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from("moderation_reports").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function verifyCreator(profileId: string, verified: boolean): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ verified_creator: verified })
    .eq("id", profileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/creators");
  return { ok: true };
}
