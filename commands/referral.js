import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ---------------------
// GENERATE CODE
// ---------------------
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

    const config = getGuildConfig(guildId);

    // Ensure referral storage exists
    if (!config.referrals) {
      config.referrals = {};
    }

    // Generate code
    const code = generateReferralCode();

    // Save referral
    config.referrals[code] = {
      creatorId: userId,
      guildId: guildId,
      uses: 0,
      createdAt: Date.now()
    };

    saveGuildConfig(guildId, config);

    return interaction.reply({
      content:
        `🎉 **Referral Code Generated!**\n\n` +
        `🔑 Code: \`${code}\`\n\n` +
        `📌 Share this with other server owners.\n` +
        `💎 When they buy premium, you earn rewards!`,
      ephemeral: true
    });
  }
};
