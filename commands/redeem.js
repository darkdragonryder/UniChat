import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../db/supabase.js';
import { getGuildSetup, saveGuildSetup } from '../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a license key for this server')
    .addStringOption(opt =>
      opt
        .setName('key')
        .setDescription('License key')
        .setRequired(true)
    ),

  async execute(interaction) {
    const key = interaction.options.getString('key');
    const guildId = interaction.guild.id;
    const now = Date.now();

    try {
      // ==============================
      // 1. GET LICENSE FROM SUPABASE
      // ==============================
      const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.error('LICENSE ERROR:', error);
        return interaction.reply({
          content: '❌ Database error while checking license.',
          ephemeral: true
        });
      }

      if (!license) {
        return interaction.reply({
          content: '❌ Invalid license key.',
          ephemeral: true
        });
      }

      if (license.used) {
        return interaction.reply({
          content: '❌ This license key has already been used.',
          ephemeral: true
        });
      }

      if (license.expiresAt && now > license.expiresAt) {
        return interaction.reply({
          content: '❌ This license key has expired.',
          ephemeral: true
        });
      }

      // ==============================
      // 2. MARK LICENSE AS USED
      // ==============================
      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          used: true,
          usedByGuild: guildId,
          usedAt: now
        })
        .eq('key', key);

      if (updateError) {
        console.error('UPDATE ERROR:', updateError);
        return interaction.reply({
          content: '❌ Failed to activate license.',
          ephemeral: true
        });
      }

      // ==============================
      // 3. UPDATE GUILD SETUP (CACHE)
      // ==============================
      await saveGuildSetup(guildId, {
        premium: true,
        licensekey: key,
        premiumexpiry: license.expiresAt || null
      });

      // ==============================
      // 4. SUCCESS RESPONSE
      // ==============================
      return interaction.reply({
        content:
          `✅ License activated successfully!\n\n` +
          `🔑 Key: ${key}\n` +
          `🏷️ Premium: Enabled\n` +
          `⏳ Expiry: ${
            license.expiresAt
              ? new Date(license.expiresAt).toLocaleString()
              : 'Lifetime'
          }`,
        ephemeral: true
      });

    } catch (err) {
      console.error('REDEEM ERROR:', err);

      return interaction.reply({
        content: '❌ Unexpected error while redeeming license.',
        ephemeral: true
      });
    }
  }
};
