import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-info')
    .setDescription('Check license status for this server'),

  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('usedByGuild', guildId)
        .eq('used', true)
        .single();

      if (error || !data) {
        return interaction.reply({
          content: '❌ No active license found for this server.',
          ephemeral: true
        });
      }

      const now = Date.now();

      // =========================
      // STATUS CHECK
      // =========================
      let status = 'ACTIVE';
      let remaining = null;

      if (data.expired) {
        status = 'EXPIRED';
      } else if (data.expiresAt === null) {
        status = 'LIFETIME';
      } else {
        const diff = data.expiresAt - now;

        if (diff <= 0) {
          status = 'EXPIRED';
        } else {
          remaining = diff;
        }
      }

      // =========================
      // FORMAT TIME LEFT
      // =========================
      let timeLeft = 'Lifetime';

      if (remaining !== null) {
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);

        timeLeft = `${days}d ${hours}h`;
      }

      // =========================
      // RESPONSE
      // =========================
      return interaction.reply({
        content:
          `📄 **License Info**\n\n` +
          `🔑 Key: \`${data.key}\`\n` +
          `📦 Type: **${data.type}**\n` +
          `📊 Status: **${status}**\n` +
          `⏳ Time Left: **${timeLeft}**\n` +
          `👤 User: <@${data.usedByUser || 'unknown'}>`,
        ephemeral: true
      });

    } catch (err) {
      console.log('license-info error:', err);

      return interaction.reply({
        content: '❌ Failed to fetch license info',
        ephemeral: true
      });
    }
  }
};
