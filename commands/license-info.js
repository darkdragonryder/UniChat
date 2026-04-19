import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../db/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-info')
    .setDescription('Check license status for this server'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('usedByGuild', guildId)
      .eq('used', true)
      .order('usedAt', { ascending: false });

    if (error) {
      console.log(error);
      return interaction.reply({ content: '❌ DB error', ephemeral: true });
    }

    const license = data?.[0];

    if (!license) {
      return interaction.reply({
        content: '❌ No active license found.',
        ephemeral: true
      });
    }

    const now = Date.now();

    let status = 'ACTIVE';
    let timeLeft = 'Lifetime';

    if (license.expired) status = 'EXPIRED';

    if (license.expiresAt && license.expiresAt !== null) {
      const diff = license.expiresAt - now;

      if (diff <= 0) {
        status = 'EXPIRED';
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        timeLeft = `${days}d ${hours}h`;
      }
    }

    const guild = interaction.guild;

    return interaction.reply({
      content:
        `📄 **License Info**\n\n` +
        `🏠 Guild: **${guild.name}**\n` +
        `🆔 Guild ID: \`${guildId}\`\n` +
        `👤 User: <@${license.usedByUser}>\n\n` +
        `🔑 Key: \`${license.key}\`\n` +
        `📦 Type: ${license.type}\n` +
        `📊 Status: ${status}\n` +
        `⏳ Time Left: ${timeLeft}`,
      ephemeral: true
    });
  }
};
