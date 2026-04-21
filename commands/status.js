import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Bot status'),

  async execute(interaction, config) {
    const mem = process.memoryUsage();

    return interaction.reply({
      content:
        `🤖 Bot Online\n` +
        `💾 DB Active\n` +
        `🔐 Licensed: ${config?.premium ?? false}\n` +
        `📦 Memory: ${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      ephemeral: true
    });
  }
};
