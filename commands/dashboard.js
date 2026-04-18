import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Open the web dashboard'),

  async execute(interaction) {
    try {

      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({
          content: '❌ No permission',
          ephemeral: true
        });
      }

      const url = process.env.DASHBOARD_URL;

      if (!url) {
        return interaction.reply({
          content: '❌ Dashboard URL not set in environment variables',
          ephemeral: true
        });
      }

      const button = new ButtonBuilder()
        .setLabel('Go to your dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL(url);

      const row = new ActionRowBuilder().addComponents(button);

      return interaction.reply({
        content: 'Here you go!',
        components: [row],
        ephemeral: true
      });

    } catch (err) {
      console.log(err);

      return interaction.reply({
        content: '❌ Failed to open dashboard',
        ephemeral: true
      });
    }
  }
};
