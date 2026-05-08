import { PermissionsBitField } from "discord.js";

export default async function unlockCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    const guild = interaction.guild;

    await channel.permissionOverwrites.edit(
      guild.roles.everyone,
      {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      }
    );

    return interaction.editReply(
      `✅ Channel ${channel} is now visible to everyone.`
    );

  } catch (err) {
    console.log("UNLOCK ERROR:", err);
    return interaction.editReply("❌ Failed to unlock channel.");
  }
}
