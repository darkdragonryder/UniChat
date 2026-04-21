import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Bot status'),

  async execute(interaction) {
    await interaction.reply({
      content: `🤖 Online\nGuilds: ${interaction.client.guilds.cache.size}`,
      ephemeral: true
    });
  }
};
