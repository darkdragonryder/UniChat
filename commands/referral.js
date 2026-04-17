import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('referral')
    .setDescription('Create or view your referral code'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const config = getGuildConfig(guildId);

    // INIT SAFE STRUCTURE
    config.referrals ??= {
      codes: {},
      leaderboard: {},
      usedServers: {}
    };

    // CHECK IF USER ALREADY HAS CODE
    let existingCode = Object.keys(config.referrals.codes)
      .find(code => config.referrals.codes[code].ownerId === userId);

    if (existingCode) {
      return interaction.reply({
        content: `🔗 Your referral code:\n\n\`${existingCode}\``,
        ephemeral: true
      });
    }

    // CREATE NEW CODE
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    config.referrals.codes[code] = {
      ownerId: userId,
      usedBy: [],
      createdAt: Date.now()
    };

    saveGuildConfig(guildId, config);

    return interaction.reply({
      content:
        `🎉 Referral code created!\n\n` +
        `🔗 Your code: \`${code}\`\n\n` +
        `Share this to earn rewards when someone buys premium!`,
      ephemeral: true
    });
  }
};
