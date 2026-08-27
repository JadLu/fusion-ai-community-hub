"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const KEY_PREFIX = "fah_";

export interface GenerateApiKeyResult {
  ok: boolean;
  error?: string;
  /** The full plaintext key — only ever returned once, at creation time. */
  plaintextKey?: string;
}

/**
 * Only the SHA-256 hash and a short display prefix are persisted — the
 * plaintext key is returned once here and never stored or logged, matching
 * how GitHub/Stripe-style API keys are typically issued.
 */
export async function generateApiKey(name: string): Promise<GenerateApiKeyResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Connect a Supabase project to enable this — see the README." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!name.trim()) return { ok: false, error: "Give this key a name." };

  const secret = randomBytes(24).toString("base64url");
  const plaintextKey = `${KEY_PREFIX}${secret}`;
  const keyHash = createHash("sha256").update(plaintextKey).digest("hex");
  const keyPrefix = plaintextKey.slice(0, 12);

  const { error } = await supabase.from("api_keys").insert({
    owner_id: user.id,
    name: name.trim(),
    key_prefix: keyPrefix,
    key_hash: keyHash,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/api-keys");
  return { ok: true, plaintextKey };
}

export async function revokeApiKey(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Connect a Supabase project to enable this — see the README." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/api-keys");
  return { ok: true };
}
