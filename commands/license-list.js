import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-list')
    .setDescription('List all licenses'),

  async execute(interaction) {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.log(error);
      return interaction.reply({
        content: '❌ Failed to fetch licenses',
        ephemeral: true
      });
    }

    if (!data || data.length === 0) {
      return interaction.reply({
        content: '📭 No licenses found',
        ephemeral: true
      });
    }

    const list = data.slice(0, 10).map(l => {
      const duration =
        l.durationDays === null ? 'lifetime' : `${l.durationDays}d`;

      const status = l.used ? 'USED' : 'ACTIVE';

      return `🔑 \`${l.key}\` | ${l.type} | ${duration} | ${status}`;
    }).join('\n');

    return interaction.reply({
      content:
        `📋 **License List (latest 10)**\n\n` +
        list,
      ephemeral: true
    });
  }
};
