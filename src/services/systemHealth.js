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
      await supabase.from("guild_settings").insert({
        guild_id: guild.id,
        enabled_channels: { EN: null },
        active_channel: null,
        default_channel: null
      });

      return { fixed: true };
    }

    let enabled = data.enabled_channels || {};

    if (!enabled.EN) {
      enabled.EN = data.default_channel || data.active_channel || null;
    }

    const cleaned = {};
    for (const [k, v] of Object.entries(enabled)) {
      if (v) cleaned[k] = v;
    }

    await supabase
      .from("guild_settings")
      .update({ enabled_channels: cleaned })
      .eq("guild_id", guild.id);

    return { fixed: true };

  } catch (err) {
    console.log("SYSTEM HEALTH ERROR:", err.message);
    return { fixed: false };
  }
}
