import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';
import { withLicenseCheck } from '../../middleware/commandGuard.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-list')
    .setDescription('List active licenses (admin tool)'),

  execute: withLicenseCheck(async (interaction) => {
    try {
      const { data } = await supabase
        .from('licenses')
        .select('*');

      const formatted = data
        .map(l => `🔑 ${l.key} | Used: ${l.used}`)
        .join('\n');

      return interaction.reply({
        content: formatted || 'No licenses found',
        ephemeral: true
      });

    } catch (err) {
      console.error(err);

      return interaction.reply({
        content: '❌ Failed to fetch licenses',
        ephemeral: true
      });
    }
  })
};
