import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../db/supabase.js';
import { saveGuildSetup, getGuildSetup } from '../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-revoke')
    .setDescription('Revoke this server license'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    try {
      console.log('🔍 Revoking guild:', guildId);

      const config = await getGuildSetup(guildId);

      if (!config) {
        return interaction.reply({
          content: '❌ No guild setup exists in database for this server.',
          ephemeral: true
        });
      }

      console.log('📦 Current config:', config);

      // ==============================
      // RESET LICENSE IN SUPABASE
      // ==============================
      if (config.licensekey) {
        const { error: supaError } = await supabase
          .from('licenses')
          .update({
            used: false,
            usedbyguild: null,
            usedat: null
          })
          .eq('key', config.licensekey);

        if (supaError) {
          console.error('❌ Supabase revoke error:', supaError);
        }
      }

      // ==============================
      // RESET GUILD SETUP
      // ==============================
      const { error: updateError } = await supabase
        .from('guild_setup')
        .update({
          premium: false,
          licensekey: null,
          premiumexpiry: null
        })
        .eq('guildid', guildId);

      if (updateError) {
        console.error('❌ Guild setup update error:', updateError);

        return interaction.reply({
          content: '❌ Database error while revoking license.',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: '🧨 License successfully revoked.',
        ephemeral: true
      });

    } catch (err) {
      console.error('🔥 REVOKE CRASH:', err);

      return interaction.reply({
        content: '❌ Unexpected revoke failure.',
        ephemeral: true
      });
    }
  }
};
