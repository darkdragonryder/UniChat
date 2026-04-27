import { supabase } from "../services/supabase.js";

export default (client) => async (guild) => {
  try {

    console.log("🔥 JOINED:", guild.name);

    // 🔥 AUTO REPAIR DB ROW
    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (!data) {
      await supabase.from("guild_settings").upsert({
        guild_id: guild.id,
        enabled_channels: {},
        default_channel: null,
        active_channel: null
      });

      console.log("🔧 Self-healed DB row for:", guild.id);
    }

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
};
