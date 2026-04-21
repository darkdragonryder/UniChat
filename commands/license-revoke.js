import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../db/supabase.js';
import { saveGuildSetup, getGuildSetup } from '../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-revoke')
    .setDescription('Revoke this server license (full reset)' ),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    try {
      // ==============================
      // GET CURRENT GUILD SETUP
      // ==============================
      const config = await getGuildSetup(guildId);

      if (!config) {
        return interaction.reply({
          content: '❌ No guild setup found.',
          ephemeral: true
        });
      }

      // ==============================
      // OPTIONAL: unmark license in Supabase (NOT deleting)
      // ==============================
      if (config.licensekey) {
        await supabase
          .from('licenses')
          .update({
            used: false,
            usedbyguild: null,
            usedat: null
          })
          .eq('key', config.licensekey);
      }

      // ==============================
      // RESET GUILD SETUP (FULL WIPE)
      // ==============================
      await saveGuildSetup(guildId, {
        premium: false,
        licensekey: null,
        premiumexpiry: null
      });

      // ==============================
      // RESPONSE
      // ==============================
      return interaction.reply({
        content:
          '🧨 **License Revoked Successfully**\n\n' +
          '✔ Premium disabled\n' +
          '✔ License unlinked\n' +
          '✔ Server reset to free state',
        ephemeral: true
      });

    } catch (err) {
      console.error('REVOKE ERROR:', err);

      return interaction.reply({
        content: '❌ Failed to revoke license.',
        ephemeral: true
      });
    }
  }
};
