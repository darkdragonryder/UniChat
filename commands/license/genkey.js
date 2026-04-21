import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';
import crypto from 'crypto';

export default {
  data: new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Generate license'),

  async execute(interaction) {

    const key = crypto.randomBytes(16).toString('hex');

    await supabase.from('licenses').insert({
      key,
      used: false
    });

    await interaction.reply({ content: `🔑 ${key}`, ephemeral: true });
  }
};
