import { supabase } from "../services/supabase.js";
import { PermissionsBitField } from "discord.js";

export default async function repairCommand(interaction) {
  try {

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels, base_channel_id")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;

    if (!channels) {
      return interaction.editReply("❌ No channels found in DB");
    }

    await guild.roles.fetch();
    await guild.channels.fetch();

    let fixed = 0;

    // ================= 🟢 PROTECT BASE CHANNEL =================
    const baseChannel = data?.base_channel_id
      ? await guild.channels.fetch(data.base_channel_id).catch(() => null)
      : null;

    if (baseChannel) {
      await baseChannel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: true,
        SendMessages: true
      }).catch(() => {});
    }

    // ================= 🔒 REPAIR LANGUAGE CHANNELS ONLY =================
    for (const [lang, channelId] of Object.entries(channels)) {

      // 🚫 SKIP BASE CHANNEL SAFETY CHECK
      if (data?.base_channel_id === channelId) continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

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

      fixed++;
    }

    return interaction.editReply(
      `✅ Repair complete: fixed ${fixed} language channels`
    );

  } catch (err) {
    console.log("REPAIR ERROR:", err);
    return interaction.editReply("❌ Repair failed");
  }
}
