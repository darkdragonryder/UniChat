import { db } from "../services/supabase.js";
import { PermissionsBitField } from "discord.js";

/**
 * Fixes ALL existing language channels without rerunning setup
 */
export async function syncLanguagePermissions(guild) {
  try {

    const supabase = db(); // ✅ FIX: correct DB init

    const { data, error } = await supabase
      .from("guild_settings")
      .select("enabled_channels, default_channel, active_channel")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (error) {
      console.log("DB ERROR:", error.message);
      return;
    }

    const channels = data?.enabled_channels;
    if (!channels) return;

    const baseId =
      data?.default_channel ||
      data?.active_channel;

    await guild.roles.fetch();
    await guild.channels.fetch();

    for (const [lang, channelId] of Object.entries(channels)) {

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      // 🟢 BASE CHANNEL (EN) — keep open
      if (channelId === baseId || lang === "EN") {
        await channel.permissionOverwrites.set([
          {
            id: guild.roles.everyone.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          },
          {
            id: guild.members.me.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          }
        ]);

        continue;
      }

      // 🔒 LANGUAGE CHANNELS
      const role = guild.roles.cache.find(r =>
        r.name.toLowerCase().includes(lang.toLowerCase())
      );

      if (!role) continue;

      await channel.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: role.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: guild.members.me.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageMessages
          ]
        }
      ]);

      console.log(`🔒 Synced permissions for ${lang}`);
    }

  } catch (err) {
    console.log("SYNC ERROR:", err);
  }
}
