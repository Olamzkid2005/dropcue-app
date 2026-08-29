import { createClient } from "@/lib/supabase/server";

/**
 * Get the current session status.
 * Returns whether the user is logged in and session details.
 */
export async function getSessionStatus() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        isLoggedIn: false,
        user: null,
        lastSignIn: null,
      };
    }

    // Get session details for last sign-in info
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      isLoggedIn: true,
      user: {
        id: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at,
      },
      session: session
        ? {
            expiresAt: session.expires_at,
            accessToken: !!session.access_token,
          }
        : null,
    };
  } catch {
    return {
      isLoggedIn: false,
      user: null,
      lastSignIn: null,
    };
  }
}

/**
 * Check if the current session is about to expire (within 5 minutes).
 */
export async function isSessionExpiringSoon(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return true;

    if (!session.expires_at) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;

    return session.expires_at - now < fiveMinutes;
  } catch {
    return true;
  }
}
