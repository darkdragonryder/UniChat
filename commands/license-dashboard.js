import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-dashboard')
    .setDescription('View all active licenses (ADMIN DASHBOARD)'),

  async execute(interaction) {
    try {
      // ==============================
      // OWNER CHECK
      // ==============================
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({
          content: '❌ No permission',
          ephemeral: true
        });
      }

      // ==============================
      // FETCH LICENSES
      // ==============================
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('used', true)
        .order('usedAt', { ascending: false });

      if (error) {
        console.log('dashboard error:', error);

        return interaction.reply({
          content: '❌ Failed to load dashboard',
          ephemeral: true
        });
      }

      if (!data || data.length === 0) {
        return interaction.reply({
          content: '📭 No active licenses found',
          ephemeral: true
        });
      }

      // ==============================
      // FORMAT OUTPUT (LIMIT 10 FOR CLEAN UI)
      // ==============================
      const page = data.slice(0, 10);

      const list = page.map((l, i) => {
        const expiry =
          l.expiresAt === null
            ? 'LIFETIME'
            : new Date(l.expiresAt).toLocaleDateString();

        return (
          `**${i + 1}. ${l.type.toUpperCase()}**\n` +
          `🏠 Guild: \`${l.usedByGuild}\`\n` +
          `👤 User: <@${l.usedByUser}>\n` +
          `🔑 Key: \`${l.key}\`\n` +
          `⏳ Expiry: ${expiry}\n`
        );
      }).join('\n');

      // ==============================
      // RESPONSE
      // ==============================
      return interaction.reply({
        content:
          `📊 **LICENSE DASHBOARD**\n\n` +
          `${list}\n\n` +
          `📦 Showing ${page.length} of ${data.length} licenses`,
        ephemeral: true
      });

    } catch (err) {
      console.log('dashboard error:', err);

      return interaction.reply({
        content: '❌ Unexpected dashboard error',
        ephemeral: true
      });
    }
  }
};
