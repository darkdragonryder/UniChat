import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🏢 GET OR CREATE GUILD SETTINGS
export async function getGuildSettings(guildId) {
  let { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guildId)
    .single();

  // AUTO CREATE IF MISSING
  if (!data) {
    const { data: created } = await supabase
      .from("guild_settings")
      .insert({
        guild_id: guildId,
        auto_translate: true,
        default_language: "EN",
        enabled_channels: []
      })
      .select()
      .single();

    return created;
  }

  return data;
}

// 👤 GET OR CREATE USER SETTINGS
export async function getUserSettings(userId) {
  let { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) {
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

  return data;
}

// 👤 SET USER LANGUAGE
export async function setUserLanguage(userId, language) {
  return await supabase
    .from("user_settings")
    .upsert({
      user_id: userId,
      language
    });
}
