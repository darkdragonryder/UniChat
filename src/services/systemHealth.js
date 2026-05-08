import { db } from "./supabase.js";

export async function systemHealth({ guild }) {
  try {
    const supabase = db();

    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (!data) {
      // Create default entry for new guild
      await supabase.from("guild_settings").insert({
        guild_id: guild.id,
        enabled_channels: {},
        active_channel: null,
        default_channel: null,
        base_channel_name: "chat"
      });

      console.log(`✅ Created default settings for guild: ${guild.name}`);
      return { fixed: true, new: true };
    }

    let enabled = data.enabled_channels || {};

    // Ensure EN key exists pointing to base channel
    if (!enabled.EN && (data.default_channel || data.active_channel)) {
      enabled.EN = data.default_channel || data.active_channel;
    }

    // Clean null/undefined entries
    const cleaned = {};
    for (const [k, v] of Object.entries(enabled)) {
      if (v) cleaned[k] = v;
    }

    // Only update if changed
    if (JSON.stringify(enabled) !== JSON.stringify(cleaned)) {
      await supabase
        .from("guild_settings")
        .update({ enabled_channels: cleaned })
        .eq("guild_id", guild.id);
    }

    return { fixed: true, new: false };

  } catch (err) {
    console.log("SYSTEM HEALTH ERROR:", err.message);
    return { fixed: false, error: err.message };
  }
}
