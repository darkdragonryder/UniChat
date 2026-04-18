import { SlashCommandBuilder } from 'discord.js';
import db from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-info')
    .setDescription('Check a license key (OWNER ONLY)')
    .addStringOption(option =>
      option
        .setName('key')
        .setDescription('License key to inspect')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // ==============================
      // OWNER ONLY CHECK
      // ==============================
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({
          content: '❌ No permission',
          flags: 64
        });
      }

      const key = interaction.options.getString('key');

      // ==============================
      // FETCH LICENSE
      // ==============================
      const row = db.prepare(`
        SELECT * FROM licenses WHERE key = ?
      `).get(key);

      if (!row) {
        return interaction.reply({
          content: '❌ License not found',
          flags: 64
        });
      }

      // ==============================
      // FORMAT EXPIRY
      // ==============================
      let expiryText = 'Lifetime';

      if (row.expiresAt) {
        const remaining = row.expiresAt - Date.now();

        if (remaining <= 0) {
          expiryText = '❌ EXPIRED';
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const days = Math.floor(hours / 24);
          const hrs = hours % 24;

          expiryText = `${days}d ${hrs}h remaining`;
        }
      }

      // ==============================
      // FORMAT RESPONSE
      // ==============================
      return interaction.reply({
        content:
          `📜 **License Info**\n\n` +
          `🔑 Key: \`${row.key}\`\n` +
          `📦 Type: ${row.type}\n` +
          `📊 Used: ${row.used ? 'YES' : 'NO'}\n` +
          `⏳ Expiry: ${expiryText}\n\n` +
          `👤 User: ${row.usedByUser || 'none'}\n` +
          `🏠 Guild: ${row.usedByGuild || 'none'}\n` +
          `📅 Created: <t:${Math.floor(row.createdAt / 1000)}:R>`,
        flags: 64
      });

    } catch (err) {
      console.log('license-info error:', err);

      return interaction.reply({
        content: '❌ Error fetching license info',
        flags: 64
      });
    }
  }
};
