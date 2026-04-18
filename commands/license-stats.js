import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-stats')
    .setDescription('View license system stats'),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('*');

    if (error) {
      return interaction.reply({
        content: '❌ Failed to fetch stats',
        ephemeral: true
      });
    }

    const total = data.length;
    const used = data.filter(l => l.used).length;
    const active = data.filter(l => !l.used && !l.expired).length;
    const expired = data.filter(l => l.expired).length;

    return interaction.reply({
      content:
        `📊 **License Stats**\n\n` +
        `📦 Total: ${total}\n` +
        `✔ Active: ${active}\n` +
        `⛔ Used: ${used}\n` +
        `⌛ Expired: ${expired}`,
      ephemeral: true
    });
  }
};
