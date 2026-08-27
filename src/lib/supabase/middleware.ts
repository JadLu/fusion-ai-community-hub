import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/qa/ask",
  "/admin",
] as const;

function isProtected(pathname: string) {
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  // /workflows/new and /workflows/[id]/edit are protected; /workflows/[id] (view) is public.
  if (pathname === "/workflows/new") return true;
  if (/^\/workflows\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}

/**
 * Refreshes the Supabase auth session on every request and redirects
 * unauthenticated visitors away from the authenticated/admin route tiers.
 * Must run via src/middleware.ts on every navigation — Server Components
 * cannot write cookies themselves, so session refresh has to happen here.
 */
export async function updateSession(request: NextRequest) {
  // No Supabase project configured — treat every request as unauthenticated
  // rather than calling createServerClient() with empty credentials (which
  // throws). Protected routes still redirect to /login as usual.
  if (!isSupabaseConfigured()) {
    const { pathname, search } = request.nextUrl;
    if (isProtected(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
