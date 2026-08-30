"use server";

import { createClient } from "@/lib/supabase/server";

const NOT_CONFIGURED_MSG =
  "Supabase is not configured. Add your Supabase credentials to .env.local";

export async function signUp(email: string, password: string) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { success: false, error: NOT_CONFIGURED_MSG };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function signIn(
  email: string,
  password: string,
  rememberMe: boolean = true
) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { success: false, error: NOT_CONFIGURED_MSG };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Send a password reset email.
 * Supabase handles the email delivery with a magic link.
 */
export async function forgotPassword(email: string) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { success: false, error: NOT_CONFIGURED_MSG };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Update the user's password after clicking the reset link.
 * The user must have a valid session (from the reset link) to call this.
 */
export async function resetPassword(newPassword: string) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { success: false, error: NOT_CONFIGURED_MSG };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get the OAuth sign-in URL for Google.
 */
export async function getGoogleSignInUrl() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { success: false, error: NOT_CONFIGURED_MSG, url: null };
  }

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
 */
export async function getAppleSignInUrl() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { success: false, error: NOT_CONFIGURED_MSG, url: null };
  }

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
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase not configured — no-op
  }
}
