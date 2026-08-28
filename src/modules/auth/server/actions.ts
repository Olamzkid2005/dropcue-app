"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get the OAuth sign-in URL for Google.
 * The client redirects the user to this URL.
 */
export async function getGoogleSignInUrl() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { success: false, error: error.message, url: null };
  }

  return { success: true, error: null, url: data.url };
}

/**
 * Get the OAuth sign-in URL for Apple.
 * The client redirects the user to this URL.
 */
export async function getAppleSignInUrl() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message, url: null };
  }

  return { success: true, error: null, url: data.url };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
