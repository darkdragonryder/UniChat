import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';

function generateKey() {
  return 'LIC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default {
  meta: { licensed: false },

  data: new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Generate a license key'),

  async execute(interaction) {
    const key = generateKey();

    const { error } = await supabase
      .from('licenses')
      .insert({
        key,
        used: false,
        expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000
      });

    if (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ Failed to generate key',
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `🔑 Generated Key:\n\`${key}\``,
      ephemeral: true
    });
  }
};
