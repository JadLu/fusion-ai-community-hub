/**
 * True once real Supabase credentials are set. Both vars are NEXT_PUBLIC_*,
 * so this check works identically on the server and in the browser.
 * Callers use it to fall back to mock data instead of letting
 * createServerClient/createBrowserClient throw on empty credentials.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
