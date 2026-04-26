import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ONLY ONE STRUCTURE RULE:
// enabled_channels MUST ALWAYS be object {}

export async function getGuildSettings(guildId) {
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();

  return data;
}
