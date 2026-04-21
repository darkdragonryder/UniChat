import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';
import { saveGuildSetup } from '../../services/guildSetupStore.js';
import { withLicenseCheck } from '../../middleware/commandGuard.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a license key')
    .addStringOption(opt =>
      opt
        .setName('key')
        .setDescription('License key')
        .setRequired(true)
    ),

  execute: withLicenseCheck(async (interaction) => {
    try {
      const key = interaction.options.getString('key');
      const guildId = interaction.guild.id;

      const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (!license || license.used) {
        return interaction.reply({
          content: '❌ Invalid or already used key.',
          ephemeral: true
        });
      }

      await supabase
        .from('licenses')
        .update({
          used: true,
          usedbyguild: guildId,
          usedat: Date.now()
        })
        .eq('key', key);

      await saveGuildSetup(guildId, {
        premium: true,
        licensekey: key,
        premiumexpiry: license.expiry || null
      });

      return interaction.reply({
        content: '✅ License activated!',
        ephemeral: true
      });

    } catch (err) {
      console.error('Redeem error:', err);

      return interaction.reply({
        content: '❌ Unexpected error while redeeming.',
        ephemeral: true
      });
    }
  })
};
