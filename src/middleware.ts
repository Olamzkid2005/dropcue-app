import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  // Skip auth if Supabase credentials are not configured (dev/placeholder mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseKey.includes("placeholder");

  const pathname = request.nextUrl.pathname;

  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/(creator)") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/orders");

  const isAuthPage =
    pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/reset-password") &&
    !pathname.startsWith("/auth/callback");

  /* Only pay the Supabase auth round-trip on routes that actually need it.
     Public pages — marketing, /p/*, /download/*, /api/* — skip it entirely,
     which removes one auth API call from every anonymous pageview. */
  if (isSupabaseConfigured && (isProtectedAppRoute || isAuthPage)) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Set cookies on the request for downstream server components
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set({ name, value, ...options })
            );
            // Re-create the response with updated request cookies
            supabaseResponse = NextResponse.next({ request });
            // Set cookies on the response so they're sent back to the browser
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });

      // Refresh session if expired — this is critical for session persistence
      // getUser() automatically refreshes expired tokens and updates cookies
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Protect app routes — redirect to login if not authenticated
      if (isProtectedAppRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        // Preserve the intended destination so we can redirect back after login
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }

      // Redirect logged-in users away from auth pages
      // But allow /auth/reset-password (from email link) and /auth/callback
      if (isAuthPage && user) {
        const url = request.nextUrl.clone();
        // Send to the intended destination if provided, otherwise dashboard
        const next = request.nextUrl.searchParams.get("next");
        url.pathname = next || "/dashboard";
        return NextResponse.redirect(url);
      }
    } catch {
      if (isProtectedAppRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        url.searchParams.set("next", pathname);
        return applySecurityHeaders(NextResponse.redirect(url));
      }
    }
  }

  return applySecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
