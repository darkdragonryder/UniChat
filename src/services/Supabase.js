// src/services/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function getGuildSettings(guildId) {
  let { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guildId)
    .single();

  if (!data) {
    const { data: created } = await supabase
      .from("guild_settings")
      .insert({ guild_id: guildId })
      .select()
      .single();

    return created;
  }

  return data;
}

export async function updateGuildSettings(guildId, updates) {
  return supabase
    .from("guild_settings")
    .update(updates)
    .eq("guild_id", guildId);
}

export async function getUserLanguage(userId) {
  let { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) return "en";
  return data.language;
}

export async function setUserLanguage(userId, lang) {
  return supabase
    .from("user_settings")
    .upsert({ user_id: userId, language: lang });
}
