import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-dashboard')
    .setDescription('Admin license dashboard with revoke system'),

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
      // FETCH ACTIVE LICENSES
      // ==============================
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('used', true)
        .eq('expired', false)
        .order('usedAt', { ascending: false });

      if (error) {
        console.log(error);
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
      // BUILD SELECT MENU (UP TO 25)
      // ==============================
      const options = data.slice(0, 25).map(l => ({
        label: `${l.type.toUpperCase()} | ${l.usedByGuild}`,
        description: `User: ${l.usedByUser || 'unknown'}`,
        value: l.key
      }));

      const row = {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: 'dashboard_revoke_select',
            placeholder: 'Select a license to revoke',
            options
          }
        ]
      };

      // ==============================
      // DASHBOARD DISPLAY
      // ==============================
      return interaction.reply({
        content:
          `📊 **LICENSE DASHBOARD**\n\n` +
          `Select a license below to revoke it instantly.`,
        components: [row],
        ephemeral: true
      });

    } catch (err) {
      console.log('dashboard error:', err);

      return interaction.reply({
        content: '❌ Dashboard error',
        ephemeral: true
      });
    }
  }
};
