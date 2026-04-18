import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-extend')
    .setDescription('Extend a license duration (OWNER ONLY)')
    .addStringOption(o =>
      o.setName('guildid')
        .setDescription('Guild ID')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName('days')
        .setDescription('Days to add (7, 14, 30 etc)')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '❌ No permission', ephemeral: true });
    }

    const guildId = interaction.options.getString('guildid');
    const days = interaction.options.getInteger('days');

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('usedByGuild', guildId)
      .eq('used', true)
      .order('usedAt', { ascending: false });

    if (error || !data?.length) {
      return interaction.reply({ content: '❌ No license found', ephemeral: true });
    }

    const license = data[0];

    let newExpiry;

    if (!license.expiresAt) {
      // lifetime → convert to time-based
      newExpiry = Date.now() + days * 86400000;
    } else {
      newExpiry = license.expiresAt + days * 86400000;
    }

    const { error: updateError } = await supabase
      .from('licenses')
      .update({
        expiresAt: newExpiry,
        expired: false
      })
      .eq('key', license.key);

    if (updateError) {
      return interaction.reply({ content: '❌ Failed to extend', ephemeral: true });
    }

    return interaction.reply({
      content:
        `⏱ **License Extended**\n\n` +
        `🏠 Guild: ${guildId}\n` +
        `➕ +${days} days added\n` +
        `📅 New expiry: <t:${Math.floor(newExpiry / 1000)}:R>`,
      ephemeral: true
    });
  }
};
