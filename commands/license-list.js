import { SlashCommandBuilder } from 'discord.js';
import db from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-list')
    .setDescription('View all license keys (ADMIN ONLY)'),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({
          content: '❌ No permission',
          flags: 64
        });
      }

      const rows = db.prepare(`
        SELECT * FROM licenses
        ORDER BY createdAt DESC
        LIMIT 20
      `).all();

      if (!rows.length) {
        return interaction.reply({
          content: 'No licenses found.',
          flags: 64
        });
      }

      const text = rows.map(r =>
        `🔑 ${r.key}\n` +
        `Type: ${r.type} | Used: ${r.used ? 'YES' : 'NO'}\n` +
        `User: ${r.usedByUser || 'none'}\n` +
        `Guild: ${r.usedByGuild || 'none'}\n`
      ).join('\n----------------\n');

      return interaction.reply({
        content: `📜 **License List**\n\n${text}`,
        flags: 64
      });

    } catch (err) {
      console.log('license-list error:', err);

      return interaction.reply({
        content: '❌ Error loading licenses',
        flags: 64
      });
    }
  }
};
