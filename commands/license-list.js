import { SlashCommandBuilder } from 'discord.js';
import supabase from '../db/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-list')
    .setDescription('View licenses (paged)'),

  async execute(interaction) {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      return interaction.reply({ content: '❌ Failed to fetch licenses', ephemeral: true });
    }

    if (!data || data.length === 0) {
      return interaction.reply({ content: '📭 No licenses found', ephemeral: true });
    }

    const pageSize = 5;
    const page = 0;

    const slice = data.slice(page * pageSize, pageSize);

    const formatted = slice.map(l => {
      const status = l.used ? 'USED' : 'ACTIVE';
      const duration = l.durationDays === null ? 'lifetime' : `${l.durationDays}d`;

      return `🔑 \`${l.key}\`\n📦 ${l.type} | ${duration} | ${status}`;
    }).join('\n\n');

    return interaction.reply({
      content:
        `📜 **License List (Page 1)**\n\n` +
        formatted,
      ephemeral: true
    });
  }
};
