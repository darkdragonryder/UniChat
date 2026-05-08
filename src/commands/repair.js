import { db } from "../services/supabase.js";
import { PermissionsBitField } from "discord.js";

export default async function repairCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const supabase = db();

    // FIX: Select default_channel and active_channel, NOT base_channel_id
    const { data, error } = await supabase
      .from("guild_settings")
      .select("enabled_channels, default_channel, active_channel")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (error) {
      console.log("DB ERROR:", error.message);
      return interaction.editReply("❌ Database error");
    }

    const channels = data?.enabled_channels;

    if (!channels) {
      return interaction.editReply("❌ No channels found in DB");
    }

    await guild.roles.fetch();
    await guild.channels.fetch();

    let fixed = 0;

    // ================= 🟢 PROTECT BASE CHANNEL =================
    // FIX: Use default_channel or active_channel
    const baseId = data?.default_channel || data?.active_channel;
    const baseChannel = baseId
      ? await guild.channels.fetch(baseId).catch(() => null)
      : null;

    if (baseChannel) {
      await baseChannel.permissionOverwrites
        .edit(guild.roles.everyone, {
          ViewChannel: true,
          SendMessages: true
        })
        .catch(() => {});
    }

    // ================= 🔒 REPAIR LANGUAGE CHANNELS =================
    for (const [lang, channelId] of Object.entries(channels)) {
      if (!channelId) continue;

      // 🚫 NEVER TOUCH BASE CHANNEL
      if (baseId === channelId) continue;

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
