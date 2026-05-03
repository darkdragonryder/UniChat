import { createClient } from "@supabase/supabase-js";

let supabase = null;

export function db() {
  if (supabase) return supabase;

  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_KEY || "").trim();

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE env vars (SUPABASE_URL / SUPABASE_KEY)"
    );
  }

  supabase = createClient(url, key, {
    auth: {
      persistSession: false
    }
  });

  return supabase;
}

/* Optional helper */
export async function getGuildSettings(guildId) {
  const client = db();

  const { data, error } = await client
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
