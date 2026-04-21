import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../db/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin-wipe')
    .setDescription('Wipe license system (SAFE or FULL)')
    .addStringOption(opt =>
      opt
        .setName('mode')
        .setDescription('SAFE = reset usage | FULL = delete everything')
        .setRequired(true)
        .addChoices(
          { name: 'SAFE', value: 'safe' },
          { name: 'FULL', value: 'full' }
        )
    ),

  async execute(interaction) {
    const mode = interaction.options.getString('mode');

    // =========================
    // SAFE MODE
    // =========================
    if (mode === 'safe') {
      const { error: licenseError } = await supabase
        .from('licenses')
        .update({
          used: false,
          usedbyguild: null,
          usedat: null
        })
        .neq('key', 'dummy'); // affects all rows

      const { error: guildError } = await supabase
        .from('guild_setup')
        .update({
          premium: false,
          licensekey: null,
          premiumexpiry: null
        });

      if (licenseError || guildError) {
        console.error('SAFE WIPE ERROR:', licenseError || guildError);

        return interaction.reply({
          content: '❌ SAFE WIPE FAILED (check logs)',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: '🟡 SAFE WIPE COMPLETE\n- licenses reset\n- guilds downgraded',
        ephemeral: true
      });
    }

    // =========================
    // FULL MODE (DANGEROUS)
    // =========================
    if (mode === 'full') {
      const { error: licenseDeleteError } = await supabase
        .from('licenses')
        .delete()
        .neq('key', 'dummy');

      const { error: guildDeleteError } = await supabase
        .from('guild_setup')
        .delete()
        .neq('guildid', 'dummy');

      if (licenseDeleteError || guildDeleteError) {
        console.error('FULL WIPE ERROR:', licenseDeleteError || guildDeleteError);

        return interaction.reply({
          content: '❌ FULL WIPE FAILED (check logs)',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: '🔴 FULL WIPE COMPLETE\n- all data removed',
        ephemeral: true
      });
    }
  }
};
