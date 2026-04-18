import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-info')
    .setDescription('Check license details')
    .addStringOption(option =>
      option
        .setName('key')
        .setDescription('License key')
        .setRequired(true)
    ),

  async execute(interaction) {
    const key = interaction.options.getString('key');

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) {
      return interaction.reply({
        content: '❌ License not found',
        ephemeral: true
      });
    }

    const duration =
      data.durationDays === null
        ? 'lifetime'
        : `${data.durationDays} days`;

    const status = data.used ? 'USED' : 'ACTIVE';

    const expiry =
      data.expiresAt === null
        ? 'lifetime'
        : `<t:${Math.floor(data.expiresAt / 1000)}:R>`;

    return interaction.reply({
      content:
        `📜 **License Info**\n\n` +
        `🔑 Key: \`${data.key}\`\n` +
        `📦 Type: ${data.type}\n` +
        `⏳ Duration: ${duration}\n` +
        `📊 Status: ${status}\n` +
        `📅 Expiry: ${expiry}\n` +
        `👤 Used By: ${data.usedByUser || 'N/A'}`,
      ephemeral: true
    });
  }
};
