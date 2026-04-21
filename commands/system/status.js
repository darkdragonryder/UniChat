import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Bot status'),

  async execute(interaction) {
    return interaction.reply({
      content:
        `🤖 Online\n` +
        `Guilds: ${interaction.client.guilds.cache.size}`,
      ephemeral: true
    });
  }
};
