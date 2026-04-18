import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Open the web dashboard'),

  async execute(interaction) {
    try {
      // OPTIONAL: restrict to admin/owner
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({
          content: '❌ No permission',
          ephemeral: true
        });
      }

      // YOUR WEB DASHBOARD LINK
      const url = process.env.DASHBOARD_URL;

      return interaction.reply({
        content:
          `🌐 **Dashboard Access**\n\n` +
          `Click below to open the web control panel:\n\n` +
          `${url}`,
        ephemeral: true
      });

    } catch (err) {
      console.log('dashboard command error:', err);

      return interaction.reply({
        content: '❌ Failed to open dashboard',
        ephemeral: true
      });
    }
  }
};
