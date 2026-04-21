import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem license')
    .addStringOption(o => o.setName('key').setRequired(true)),

  async execute(interaction) {

    const key = interaction.options.getString('key');

    await supabase
      .from('licenses')
      .update({
        used: true,
        usedbyguild: interaction.guild.id
      })
      .eq('key', key);

    await interaction.reply('✅ License applied');
  }
};
