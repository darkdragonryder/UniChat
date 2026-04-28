import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Make this channel visible to everyone')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
  const channel = interaction.channel;
  const everyone = interaction.guild.roles.everyone;

  try {
    // Fix channel
    await channel.permissionOverwrites.edit(everyone, {
      ViewChannel: true,
    });

    // Fix category (if exists)
    if (channel.parent) {
      await channel.parent.permissionOverwrites.edit(everyone, {
        ViewChannel: true,
      });
    }

    await interaction.reply({
      content: '✅ Channel is now visible to everyone.',
      ephemeral: true,
    });

  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: '❌ Failed to update permissions.',
      ephemeral: true,
    });
  }
}
