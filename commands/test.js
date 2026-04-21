import { SlashCommandBuilder } from 'discord.js';
import { generateLicenseKey, validateKey, useKey } from '../services/licenseStore.js';
import { applyLicenseKey } from '../services/unichatCore.js';
import { checkFraud } from '../services/fraudCheck.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('System diagnostic test (SAFE MODE)'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const results = [];
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    try {
      // =========================
      // 1. FRAUD CHECK
      // =========================
      const fraud = checkFraud({
        userId,
        ownerId: process.env.OWNER_ID,
        code: 'DIAG_TEST',
        guildId
      });

      results.push(`🛡 Fraud check: ${fraud.ok ? 'PASS' : fraud.reason}`);

      // =========================
      // 2. GENERATE LICENSE
      // =========================
      const { key } = await generateLicenseKey('7day', 7);
      results.push(`🔑 Generate: OK`);

      // =========================
      // 3. VALIDATE LICENSE
      // =========================
      const validate = await validateKey(key);
      results.push(`📦 Validate: ${validate.ok ? 'PASS' : validate.reason}`);

      // =========================
      // 4. APPLY LICENSE
      // =========================
      const apply = await applyLicenseKey(guildId, userId, key);
      results.push(`⚙️ Apply: ${apply.ok ? 'PASS' : apply.reason}`);

      // =========================
      // 5. USE KEY (MARK USED TEST)
      // =========================
      if (validate.ok) {
        await useKey(key, guildId, userId);
        results.push(`🔐 UseKey: PASS`);
      }

      // =========================
      // FINAL OUTPUT
      // =========================
      return interaction.editReply(
        `🧪 **DIAGNOSTIC COMPLETE**\n\n` +
        results.map(r => `• ${r}`).join('\n') +
        `\n\n✅ System stable`
      );

    } catch (err) {
      console.error('TEST ERROR:', err);

      return interaction.editReply(
        `❌ **DIAGNOSTIC FAILED**\n\nError:\n\`\`\`${err.message}\`\`\``
      );
    }
  }
};
