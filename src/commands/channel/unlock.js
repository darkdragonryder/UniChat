import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("unlock")
  .setDescription("Make this channel visible to everyone")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export default async function unlockCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true }); // ✅ safer

    const channel = interaction.channel;
    const guild = interaction.guild;

    if (!channel || !guild) {
      return interaction.editReply("❌ Invalid channel or guild.");
    }

    const everyone = guild.roles.everyone;

    // ================= CHECK BOT PERMISSIONS =================
    if (!channel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply("❌ I don’t have permission to manage this channel.");
    }

    // ================= UNLOCK CHANNEL =================
    await channel.permissionOverwrites.edit(everyone, {
      ViewChannel: true
    }).catch(() => {});

    // ================= UNLOCK CATEGORY (IF EXISTS) =================
    if (channel.parent) {
      await channel.parent.permissionOverwrites.edit(everyone, {
        ViewChannel: true
      }).catch(() => {});
    }

    return interaction.editReply("✅ Channel is now visible to everyone.");

  } catch (err) {
    console.log("UNLOCK ERROR:", err);

    try {
      return interaction.editReply("❌ Failed to unlock channel.");
    } catch {
      return;
    }
  }
}
