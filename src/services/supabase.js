import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function getGuildSettings(guildId) {
  const { data, error } = await supabase
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
