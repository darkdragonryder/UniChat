import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';
import { getGuildSetup, saveGuildSetup } from '../../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('revoke')
    .setDescription('Revoke license for this server'),

  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;

      const guild = await getGuildSetup(guildId);

      if (guild?.licensekey) {
        await supabase
          .from('licenses')
          .update({
            used: false,
            usedbyguild: null,
            usedat: null
          })
          .eq('key', guild.licensekey);
      }

      await saveGuildSetup(guildId, {
        premium: false,
        licensekey: null,
        premiumexpiry: null
      });

      return interaction.reply({
        content: '🧨 License revoked successfully.',
        ephemeral: true
      });

    } catch (err) {
      console.error('Revoke error:', err);

      return interaction.reply({
        content: '❌ Failed to revoke license.',
        ephemeral: true
      });
    }
  }
};
