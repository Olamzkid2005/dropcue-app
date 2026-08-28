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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value }) =>
              supabaseResponse.cookies.set(name, value)
            );
          },
        },
      });

      // Refresh session if expired - required for Server Components
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Protect app routes
      if (
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/(creator)") ||
        request.nextUrl.pathname.startsWith("/products") ||
        request.nextUrl.pathname.startsWith("/orders")
      ) {
        if (!user) {
          const url = request.nextUrl.clone();
          url.pathname = "/auth/login";
          return NextResponse.redirect(url);
        }
      }

      // Redirect logged-in users away from auth pages
      if (request.nextUrl.pathname.startsWith("/auth")) {
        if (user) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
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
