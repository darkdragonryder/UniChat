import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import { supabase } from '../../db/supabase.js';

export default {
  meta: {
    licensed: false
  },

  data: new SlashCommandBuilder()
    .setName('license-panel')
    .setDescription('Open license control panel'),

  async execute(interaction) {

    // Fetch guilds bot knows about (from DB)
    const { data: guilds } = await supabase
      .from('guild_setup')
      .select('guildid, premium, licensekey');

    const options = (guilds || []).map(g => ({
      label: `Guild ${g.guildid}`,
      description: g.premium ? 'Premium Active' : 'Not Licensed',
      value: g.guildid
    })).slice(0, 25);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('license_select_guild')
      .setPlaceholder('Select a server')
      .addOptions(options.length ? options : [{
        label: 'No guilds found',
        value: 'none'
      }]);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setTitle('🔐 License Control Panel')
      .setDescription('Select a server to manage license')
      .setColor(0x00ff99);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};
