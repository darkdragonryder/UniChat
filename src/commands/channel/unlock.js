import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("unlock")
  .setDescription("Make this channel visible to everyone")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export default async function unlockCommand(interaction) {
  const channel = interaction.channel;
  const everyone = interaction.guild.roles.everyone;

  try {
    await channel.permissionOverwrites.edit(everyone, {
      ViewChannel: true,
    });

    if (channel.parent) {
      await channel.parent.permissionOverwrites.edit(everyone, {
        ViewChannel: true,
      });
    }

    await interaction.reply({
      content: "✅ Channel is now visible to everyone.",
      ephemeral: true,
    });

  } catch (err) {
    console.log("UNLOCK ERROR:", err.message);

    await interaction.reply({
      content: "❌ Failed to unlock channel.",
      ephemeral: true,
    });
  }
}
