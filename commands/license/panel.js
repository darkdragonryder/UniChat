import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { supabase } from '../../db/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-panel')
    .setDescription('Admin License Control Panel (V2)'),

  async execute(interaction) {
    // Fetch all licenses
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*');

    if (error) {
      return interaction.reply({
        content: '❌ Failed to load licenses',
        ephemeral: true
      });
    }

    if (!licenses || licenses.length === 0) {
      return interaction.reply({
        content: '⚠️ No licenses found',
        ephemeral: true
      });
    }

    // Build dropdown options
    const options = licenses.map(l => ({
      label: `${l.guild_name || 'Unknown Server'}`,
      description: `User: ${l.user_id || 'Unknown'} | Key: ${l.key}`,
      value: l.id
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId('license_select')
      .setPlaceholder('Select a license...')
      .addOptions(options.slice(0, 25));

    const row = new ActionRowBuilder().addComponents(select);

    const embed = new EmbedBuilder()
      .setTitle('🔐 License Control Panel V2')
      .setDescription('Select a license below to manage it.')
      .setColor(0x00ff99);

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};
