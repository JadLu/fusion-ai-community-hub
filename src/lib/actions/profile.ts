"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface UpdateProfileInput {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
}

export interface UpdateProfileResult {
  ok: boolean;
  error?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Connect a Supabase project to enable this — see the README." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not signed in." };
  if (!/^[a-z0-9_.-]{3,32}$/i.test(input.username)) {
    return { ok: false, error: "Username must be 3-32 characters (letters, numbers, _ . -)." };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username: input.username,
    display_name: input.displayName.trim() || input.username,
    bio: input.bio.trim() || null,
    avatar_url: input.avatarUrl,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That username is already taken." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/profile");
  return { ok: true };
}
