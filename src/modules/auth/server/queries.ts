import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Creator } from "../types";

export async function getCurrentUser(): Promise<Creator | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch creator record from our database
  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", user.id)
    .single();

  return creator;
}

export async function getCreatorById(id: string): Promise<Creator | null> {
  const supabase = createAdminClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", id)
    .single();

  return creator;
}
