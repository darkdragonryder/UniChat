import { supabase } from "./supabase.js";

export async function systemHealth({ guild }) {
  try {

    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    // ================= CREATE DEFAULT IF MISSING =================
    if (!data) {
      await supabase.from("guild_settings").insert({
        guild_id: guild.id,
        enabled_channels: {
          EN: null
        },
        active_channel: null,
        default_channel: null
      });

      return { fixed: true, reason: "created_missing_guild_settings" };
    }

    let enabled = data.enabled_channels || {};

    // ================= ENSURE EN EXISTS =================
    if (!enabled.EN) {
      const baseChannel =
        data.default_channel ||
        data.active_channel ||
        null;

      enabled.EN = baseChannel;
    }

    // ================= NORMALIZE STRUCTURE =================
    const cleaned = {};

    for (const [lang, id] of Object.entries(enabled)) {
      if (id) cleaned[lang] = id;
    }

    // always ensure EN exists even if null
    cleaned.EN = enabled.EN || data.default_channel || data.active_channel;

    // ================= SAVE BACK CLEAN DATA =================
    await supabase
      .from("guild_settings")
      .update({
        enabled_channels: cleaned
      })
      .eq("guild_id", guild.id);

    return { fixed: true };

  } catch (err) {
    console.log("SYSTEM HEALTH ERROR:", err.message);
    return { fixed: false };
  }
}
