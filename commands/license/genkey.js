import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';

function generateKey() {
  return 'LIC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function getExpiry(type) {
  const now = Date.now();

  switch (type) {
    case '7day':
      return now + 7 * 24 * 60 * 60 * 1000;

    case '30day':
      return now + 30 * 24 * 60 * 60 * 1000;

    case 'lifetime':
      return null; // no expiry

    default:
      return now + 30 * 24 * 60 * 60 * 1000;
  }
}

export default {
  meta: { licensed: false },

  data: new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Generate a license key')
    .addStringOption(opt =>
      opt.setName('duration')
        .setDescription('License duration')
        .setRequired(true)
        .addChoices(
          { name: '7 Days', value: '7day' },
          { name: '30 Days', value: '30day' },
          { name: 'Lifetime', value: 'lifetime' }
        )
    ),

  async execute(interaction) {
    const duration = interaction.options.getString('duration');
    const key = generateKey();
    const expires_at = getExpiry(duration);

    const { error } = await supabase
      .from('licenses')
      .insert({
        key,
        used: false,
        expires_at
      });

    if (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ Failed to generate key',
        ephemeral: true
      });
    }

    return interaction.reply({
      content:
        `🔑 **License Generated**\n` +
        `Key: \`${key}\`\n` +
        `Duration: **${duration}**\n` +
        `Expiry: ${expires_at ? new Date(expires_at).toLocaleString() : 'Lifetime'}`,
      ephemeral: true
    });
  }
};
