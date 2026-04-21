import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('revoke')
    .setDescription('Revoke license')
    .addStringOption(o => o.setName('key').setRequired(true)),

  async execute(interaction) {

    const key = interaction.options.getString('key');

    await supabase
      .from('licenses')
      .update({
        used: false,
        usedbyguild: null
      })
      .eq('key', key);

    await interaction.reply('❌ License revoked');
  }
};
