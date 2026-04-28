import { supabase } from "../services/supabase.js";

/**
 * Fixes ALL existing language channels without rerunning setup
 */
export async function syncLanguagePermissions(guild) {
  try {

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;
    if (!channels) return;

    await guild.roles.fetch();
    await guild.channels.fetch();

    for (const [lang, channelId] of Object.entries(channels)) {

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      // find matching role by language name or code
      const role =
        guild.roles.cache.find(r =>
          r.name.toLowerCase().includes(lang.toLowerCase())
        );

      if (!role) continue;

      // ================= APPLY PERMISSIONS =================
      await channel.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          deny: ["ViewChannel"]
        },
        {
          id: role.id,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
        },
        {
          id: guild.members.me.id,
          allow: ["ViewChannel", "SendMessages", "ManageMessages"]
        }
      ]);

      console.log(`🔒 Synced permissions for ${lang}`);
    }

  } catch (err) {
    console.log("SYNC ERROR:", err.message);
  }
}
