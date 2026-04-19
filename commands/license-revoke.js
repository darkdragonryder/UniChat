import { SlashCommandBuilder } from 'discord.js';
import supabase from '../db/supabase.js';
import { saveGuildConfig, getGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-revoke')
    .setDescription('Revoke a server license (OWNER ONLY)')
    .addStringOption(option =>
      option
        .setName('guildid')
        .setDescription('Guild ID to revoke license from')
        .setRequired(true)
    ),

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

      const guildId = interaction.options.getString('guildid');

      // ==============================
      // FIND LICENSE
      // ==============================
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('usedByGuild', guildId)
        .eq('used', true)
        .order('usedAt', { ascending: false });

      if (error) {
        console.log('revoke fetch error:', error);

        return interaction.reply({
          content: '❌ Database error',
          ephemeral: true
        });
      }

      const license = data?.[0];

      if (!license) {
        return interaction.reply({
          content: '❌ No active license found for that guild.',
          ephemeral: true
        });
      }

      // ==============================
      // UPDATE SUPABASE (DISABLE LICENSE)
      // ==============================
      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          used: true,
          expired: true,
          expiresAt: Date.now()
        })
        .eq('key', license.key);

      if (updateError) {
        console.log('revoke update error:', updateError);

        return interaction.reply({
          content: '❌ Failed to revoke license.',
          ephemeral: true
        });
      }

      // ==============================
      // UPDATE LOCAL CONFIG (SAFETY)
      // ==============================
      const config = getGuildConfig(guildId);

      if (config) {
        config.premium = false;
        config.premiumExpiry = null;
        config.mode = 'revoked';

        saveGuildConfig(guildId, config);
      }

      // ==============================
      // RESPONSE
      // ==============================
      return interaction.reply({
        content:
          `🚫 **License Revoked**\n\n` +
          `🔑 Key: \`${license.key}\`\n` +
          `📦 Type: ${license.type}\n` +
          `❌ Status: DISABLED`,
        ephemeral: true
      });

    } catch (err) {
      console.log('license-revoke error:', err);

      return interaction.reply({
        content: '❌ Unexpected error while revoking license.',
        ephemeral: true
      });
    }
  }
};
