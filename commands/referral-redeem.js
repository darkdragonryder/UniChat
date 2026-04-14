import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ---------------------
// CLEAN CODE FORMAT
// ---------------------
function normalize(code) {
  return code.trim().toUpperCase();
}

export default {
  data: new SlashCommandBuilder()
    .setName('referral-redeem')
    .setDescription('Redeem a referral code for this server')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Referral code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const code = normalize(interaction.options.getString('code'));

    const config = getGuildConfig(guildId);

    // =====================================================
    // ❌ BLOCK: ALREADY USED REFERRAL
    // =====================================================
    if (config.referredBy) {
      return interaction.reply({
        content: '❌ This server has already used a referral code.',
        ephemeral: true
      });
    }

    // =====================================================
    // ❌ CHECK IF CODE EXISTS
    // =====================================================
    const refData = config.referrals?.codes?.[code];

    if (!refData) {
      return interaction.reply({
        content: '❌ Invalid referral code.',
        ephemeral: true
      });
    }

    // =====================================================
    // LINK SERVER → REFERRER
    // =====================================================
    config.referredBy = {
      code,
      ownerId: refData.creatorId,
      guildId: refData.guildId,
      redeemedAt: Date.now()
    };

    // =====================================================
    // UPDATE CODE USAGE
    // =====================================================
    if (!config.referrals.codes[code].uses) {
      config.referrals.codes[code].uses = 0;
    }

    config.referrals.codes[code].uses += 1;

    // =====================================================
    // TRACK LEADERBOARD
    // =====================================================
    const ownerId = refData.creatorId;

    if (!config.referrals.leaderboard[ownerId]) {
      config.referrals.leaderboard[ownerId] = 0;
    }

    config.referrals.leaderboard[ownerId] += 1;

    saveGuildConfig(guildId, config);

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================
    return interaction.reply({
      content:
        `🎉 **Referral Activated!**\n\n` +
        `✔ Code: \`${code}\`\n` +
        `✔ Server linked to referral system\n` +
        `✔ Rewards will apply when premium is activated`,
      ephemeral: true
    });
  }
};
