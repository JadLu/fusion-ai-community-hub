import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SessionUser } from "@/components/layout/user-menu";

/**
 * Loads the current authenticated user's profile for use in Server Component
 * layouts. Returns null when signed out (or when no Supabase project is
 * configured) — callers in protected route groups redirect in that case
 * (middleware already blocks the request, this is defense in depth for
 * direct RSC rendering / cache edge cases).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    username: profile?.username ?? user.email?.split("@")[0] ?? "member",
    displayName: profile?.display_name ?? user.email ?? "Member",
    avatarUrl: profile?.avatar_url ?? null,
    role: profile?.role ?? "member",
  };
}
