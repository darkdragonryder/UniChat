import { SlashCommandBuilder } from 'discord.js';
import { redeemReferralCode } from '../utils/referralService.js';

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
    const userId = interaction.user.id;
    const code = normalize(interaction.options.getString('code'));

    // =========================
    // CALL SERVICE
    // =========================
    const result = redeemReferralCode(guildId, userId, code);

    // =========================
    // ERROR HANDLING (FIXED)
    // =========================
    if (!result.ok) {
      let msg = '❌ Invalid referral code.';

      if (result.reason === 'SELF_REFERRAL') {
        msg = '❌ You cannot use your own referral code.';
      }

      if (result.reason === 'ALREADY_USED') {
        msg = '❌ This server has already used a referral code.';
      }

      if (result.reason?.startsWith('FRAUD_BLOCKED')) {
        msg = '🚫 Suspicious activity detected. Try again later.';
      }

      return interaction.reply({
        content: msg,
        ephemeral: true
      });
    }

    // =========================
    // SUCCESS RESPONSE
    // =========================
    let rewardText = '';

    if (result.reward === 'week') rewardText = '🎁 7 Days Premium Unlocked!';
    if (result.reward === 'month') rewardText = '🎁 30 Days Premium Unlocked!';
    if (result.reward === 'lifetime') rewardText = '👑 Lifetime Premium Unlocked!';

    return interaction.reply({
      content:
        `🎉 **Referral Activated!**\n\n` +
        `✔ Code accepted\n` +
        `✔ Total uses: ${result.totalUses || 0}` +
        (rewardText ? `\n${rewardText}` : ''),
      ephemeral: true
    });
  }
};
