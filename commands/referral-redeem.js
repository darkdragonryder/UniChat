import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('referral-redeem')
    .setDescription('Redeem a referral code')
    .addStringOption(o =>
      o.setName('code')
        .setDescription('Referral code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');

    const config = getGuildConfig(interaction.guild.id);

    if (!config?.referrals?.codes?.[code]) {
      return interaction.reply({
        content: '❌ Invalid code',
        ephemeral: true
      });
    }

    const ref = config.referrals.codes[code];

    // self-use protection
    if (ref.ownerId === interaction.user.id) {
      return interaction.reply({
        content: '❌ You cannot use your own code',
        ephemeral: true
      });
    }

    // init structures safely
    if (!config.referrals.usedServers) config.referrals.usedServers = {};
    if (!config.referrals.leaderboard) config.referrals.leaderboard = {};
    if (!Array.isArray(ref.usedBy)) ref.usedBy = [];

    // already used check
    if (config.referrals.usedServers[interaction.user.id]) {
      return interaction.reply({
        content: '❌ You already used a referral code',
        ephemeral: true
      });
    }

    // mark used
    config.referrals.usedServers[interaction.user.id] = {
      code,
      usedAt: Date.now()
    };

    // update referral stats
    ref.usedBy.push(interaction.user.id);

    config.referrals.leaderboard[ref.ownerId] =
      (config.referrals.leaderboard[ref.ownerId] || 0) + 1;

    const total = config.referrals.leaderboard[ref.ownerId];

    saveGuildConfig(interaction.guild.id, config);

    return interaction.reply({
      content:
        `🎉 Referral successful!\n\n` +
        `⭐ Total referrals: **${total}**`,
      ephemeral: true
    });
  }
};
