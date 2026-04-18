import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-stats')
    .setDescription('View license system stats'),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '❌ No permission', ephemeral: true });
    }

    const { data } = await supabase
      .from('licenses')
      .select('*');

    const total = data?.length || 0;
    const used = data?.filter(l => l.used).length || 0;
    const active = data?.filter(l => !l.used).length || 0;
    const expired = data?.filter(l => l.expired).length || 0;

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
