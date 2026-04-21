import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';
import { saveGuildSetup } from '../../services/guildSetupStore.js';

export default {
  meta: { licensed: false },

  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a license key')
    .addStringOption(opt =>
      opt.setName('key').setDescription('License key').setRequired(true)
    ),

  async execute(interaction) {
    const key = interaction.options.getString('key');
    const guildId = interaction.guild.id;

    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (!license || license.used) {
      return interaction.reply({
        content: '❌ Invalid or already used key',
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
      premiumexpiry: license.expires_at
    });

    return interaction.reply({
      content: '✅ License activated',
      ephemeral: true
    });
  }
};
