import { createClient } from "@supabase/supabase-js";

let supabase = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY");
  }

  supabase = createClient(url, key);
  return supabase;
}

export function db() {
  return getSupabaseClient();
}

/* =========================
   GUILD SETTINGS
========================= */
export async function getGuildSettings(guildId) {
  const { data, error } = await getSupabaseClient()
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();

  if (error) {
    console.log("DB ERROR:", error.message);
    return null;
  }

  return data;
}
