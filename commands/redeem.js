import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../db/supabase.js';
import { saveGuildSetup } from '../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a license key')
    .addStringOption(opt =>
      opt.setName('key').setDescription('License key').setRequired(true)
    ),

  async execute(interaction) {
    const key = interaction.options.getString('key');
    const guildId = interaction.guild.id;
    const now = Date.now();

    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (!license) {
      return interaction.reply({ content: '❌ Invalid key', ephemeral: true });
    }

    if (license.used) {
      return interaction.reply({ content: '❌ Already used', ephemeral: true });
    }

    if (license.expires_at && Date.now() > license.expires_at) {
      return interaction.reply({ content: '❌ Expired', ephemeral: true });
    }

    // mark used
    await supabase
      .from('licenses')
      .update({
        used: true,
        usedbyguild: guildId,
        usedat: now
      })
      .eq('key', key);

    // save to guild
    await saveGuildSetup(guildId, {
      premium: true,
      licensekey: key,
      premiumexpiry: license.expires_at || null
    });

    return interaction.reply({
      content: '✅ License activated!',
      ephemeral: true
    });
  }
};
