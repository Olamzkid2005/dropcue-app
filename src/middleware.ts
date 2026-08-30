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

  if (isSupabaseConfigured) {
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
      if (
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/(creator)") ||
        request.nextUrl.pathname.startsWith("/products") ||
        request.nextUrl.pathname.startsWith("/orders")
      ) {
        if (!user) {
          const url = request.nextUrl.clone();
          url.pathname = "/auth/login";
          // Preserve the intended destination so we can redirect back after login
          url.searchParams.set("next", request.nextUrl.pathname);
          return NextResponse.redirect(url);
        }
      }

      // Redirect logged-in users away from auth pages
      // But allow /auth/reset-password (from email link) and /auth/callback
      if (
        request.nextUrl.pathname.startsWith("/auth") &&
        !request.nextUrl.pathname.startsWith("/auth/reset-password") &&
        !request.nextUrl.pathname.startsWith("/auth/callback")
      ) {
        if (user) {
          const url = request.nextUrl.clone();
          // Send to the intended destination if provided, otherwise dashboard
          const next = request.nextUrl.searchParams.get("next");
          url.pathname = next || "/dashboard";
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // Supabase client creation failed — proceed without auth
    }
  }

  return applySecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
