import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-info')
    .setDescription('Check a license key status')
    .addStringOption(opt =>
      opt
        .setName('key')
        .setDescription('License key to check')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const key = interaction.options.getString('key');

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) {
        return interaction.reply({
          content: '❌ License not found',
          ephemeral: true
        });
      }

      const now = Date.now();

      // ==============================
      // STATUS CALCULATION
      // ==============================
      let status = 'ACTIVE';

      if (data.used && data.expiresAt && now > data.expiresAt) {
        status = 'EXPIRED';
      }

      if (!data.used) {
        status = 'UNUSED';
      }

      const expiryText =
        data.expiresAt === null
          ? 'lifetime'
          : `<t:${Math.floor(data.expiresAt / 1000)}:R>`;

      return interaction.reply({
        content:
`📜 **License Info**

🔑 Key: \`${data.key}\`
📦 Type: ${data.type}
📊 Used: ${data.used ? 'YES' : 'NO'}
📌 Status: **${status}**
⏳ Expiry: ${expiryText}

👤 User: ${data.usedByUser || 'none'}
🏠 Guild: ${data.usedByGuild || 'none'}
📅 Created: <t:${Math.floor(data.createdAt / 1000)}:R>`,
        ephemeral: true
      });

    } catch (err) {
      console.log('license-info error:', err);

      return interaction.reply({
        content: '❌ Error fetching license info',
        ephemeral: true
      });
    }
  }
};
