import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createReferralCode } from '../services/referralService.js';

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'UNI-';

  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

export default {
  data: new SlashCommandBuilder()
    .setName('referral')
    .setDescription('Generate a referral code for your server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const code = generateReferralCode();

    // create code
    createReferralCode(guildId, userId, code);

    return interaction.reply({
      content:
        `🎉 **Referral Code Generated!**\n\n` +
        `🔑 Code: \`${code}\`\n\n` +
        `📌 Share this with server owners\n` +
        `💎 Rewards are tracked automatically`,
      ephemeral: true
    });
  }
};
