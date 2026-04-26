import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ================= GUILD SETTINGS =================
export async function getGuildSettings(guildId) {
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();

  if (data) return data;

  const { data: created } = await supabase
    .from("guild_settings")
    .insert({
      guild_id: guildId,
      auto_translate: true,
      default_language: "EN",
      enabled_channels: {}   // ✅ FIXED (WAS [])
    })
    .select()
    .single();

  return created;
}

// ================= USER SETTINGS =================
export async function getUserSettings(userId) {
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data;

  const { data: created } = await supabase
    .from("user_settings")
    .insert({
      user_id: userId,
      language: null
    })
    .select()
    .single();

  return created;
}
