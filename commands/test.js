import { SlashCommandBuilder } from 'discord.js';

import { generateLicenseKey, validateKey, revokeLicense } from '../services/licenseStore.js';
import { applyLicenseKey } from '../services/unichatCore.js';
import { checkFraud } from '../services/fraudCheck.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('FULL system stress test (OWNER ONLY)'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // =========================
    // OWNER CHECK
    // =========================
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.editReply('❌ Owner only');
    }

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const results = [];

    try {
      // =========================
      // FRAUD TEST (multi hit)
      // =========================
      let blocked = 0;

      for (let i = 0; i < 5; i++) {
        const fraud = checkFraud({
          userId,
          ownerId: process.env.OWNER_ID,
          code: 'TEST_CODE',
          guildId
        });

        if (!fraud.ok) blocked++;
      }

      results.push(`🛡 Fraud stress: ${blocked}/5 blocked`);

      // =========================
      // GENERATE
      // =========================
      const key = await generateLicenseKey('7day', 7);

      results.push(`🔑 Generate: OK`);

      // =========================
      // VALIDATE
      // =========================
      const val = await validateKey(key);

      results.push(
        `📦 Validate: ${val.ok ? 'OK' : 'FAIL'}`
      );

      // =========================
      // APPLY
      // =========================
      const apply = await applyLicenseKey(guildId, userId, key);

      results.push(
        `⚙️ Apply: ${apply.ok ? 'OK' : apply.reason}`
      );

      // =========================
      // REVOKE
      // =========================
      const revoke = await revokeLicense(guildId);

      results.push(
        `♻️ Revoke: ${revoke ? 'OK' : 'FAIL'}`
      );

      // =========================
      // FINAL OUTPUT
      // =========================
      return interaction.editReply(
        `🧪 **STRESS TEST COMPLETE**\n\n` +
        results.map(r => `• ${r}`).join('\n') +
        `\n\n✅ System stable`
      );

    } catch (err) {
      console.log('TEST ERROR:', err);
      return interaction.editReply('❌ Test failed (see logs)');
    }
  }
};
