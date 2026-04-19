import { SlashCommandBuilder } from 'discord.js';
import supabase from '../db/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-search')
    .setDescription('Search licenses by guild or user')
    .addStringOption(o =>
      o.setName('query')
        .setDescription('Guild ID or User ID')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '❌ No permission', ephemeral: true });
    }

    const query = interaction.options.getString('query');

    const { data } = await supabase
      .from('licenses')
      .select('*')
      .or(`usedByGuild.eq.${query},usedByUser.eq.${query}`)
      .order('usedAt', { ascending: false });

    if (!data?.length) {
      return interaction.reply({
        content: '❌ No results found',
        ephemeral: true
      });
    }

    const result = data.map(l =>
      `🔑 ${l.type.toUpperCase()}
🏠 Guild: ${l.usedByGuild}
👤 User: <@${l.usedByUser}>
⏳ Expiry: ${l.expiresAt ? new Date(l.expiresAt).toLocaleString() : 'LIFETIME'}`
    ).join('\n\n');

    return interaction.reply({
      content: `🔎 **Search Results**\n\n${result}`,
      ephemeral: true
    });
  }
};
