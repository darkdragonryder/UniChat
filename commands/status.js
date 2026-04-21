import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Bot system status'),

  async execute(interaction, config) {
    try {
      const memory = process.memoryUsage();

      const status = {
        bot: 'Online',
        database: 'Active',
        licenseSystem: config?.premium ? 'Active (Licensed)' : 'Inactive',
        fraudSystem: 'Active',
        guildId: interaction.guild?.id,
        premium: config?.premium ?? false,
        mode: config?.mode ?? 'unknown'
      };

      return interaction.reply({
        content:
          `📊 **System Status**\n\n` +
          `🤖 Bot: ${status.bot}\n` +
          `🗄️ Database: ${status.database}\n` +
          `🔐 License: ${status.licenseSystem}\n` +
          `🚨 Fraud: ${status.fraudSystem}\n` +
          `🏷️ Premium: ${status.premium}\n` +
          `⚙️ Mode: ${status.mode}\n\n` +
          `📦 Memory Usage:\n` +
          `RSS: ${(memory.rss / 1024 / 1024).toFixed(2)}MB\n` +
          `Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        ephemeral: true
      });

    } catch (err) {
      console.error('STATUS ERROR:', err);

      if (interaction.replied || interaction.deferred) {
        return interaction.editReply('❌ Status failed');
      }

      return interaction.reply({
        content: '❌ Status failed',
        ephemeral: true
      });
    }
  }
};
