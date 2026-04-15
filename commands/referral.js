import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createReferralCode } from '../utils/referralService.js';

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
    const code = generateReferralCode();

    createReferralCode(
      interaction.guild.id,
      interaction.user.id,
      code
    );

    return interaction.reply({
      content:
        `🎉 **Referral Code Generated!**\n\n` +
        `🔑 \`${code}\`\n\n` +
        `Share this with other server owners.`,
      ephemeral: true
    });
  }
};
