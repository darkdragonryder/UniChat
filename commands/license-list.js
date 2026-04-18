import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-list')
    .setDescription('View all license keys (ADMIN ONLY)'),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({
          content: '❌ No permission',
          ephemeral: true
        });
      }

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(20);

      if (error) {
        console.log('license-list error:', error);
        return interaction.reply({
          content: '❌ Error loading licenses',
          ephemeral: true
        });
      }

      if (!data || data.length === 0) {
        return interaction.reply({
          content: 'No licenses found.',
          ephemeral: true
        });
      }

      const text = data.map(r =>
        `🔑 ${r.key}\n` +
        `Type: ${r.type} | Used: ${r.used ? 'YES' : 'NO'}\n` +
        `User: ${r.usedByUser || 'none'}\n` +
        `Guild: ${r.usedByGuild || 'none'}\n` +
        `Expiry: ${r.expiresAt ? `<t:${Math.floor(r.expiresAt / 1000)}:R>` : 'lifetime'}`
      ).join('\n----------------\n');

      return interaction.reply({
        content: `📜 **License List**\n\n${text}`,
        ephemeral: true
      });

    } catch (err) {
      console.log('license-list crash:', err);

      return interaction.reply({
        content: '❌ Unexpected error',
        ephemeral: true
      });
    }
  }
};
