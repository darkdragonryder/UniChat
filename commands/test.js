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

    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.editReply('❌ Owner only');
    }

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const results = [];

    try {
      // =========================
      // FRAUD TEST
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
      const gen = await generateLicenseKey('7day', 7);
      const key = gen.key; // ✅ FIX

      results.push(`🔑 Generate: OK`);

      // =========================
      // VALIDATE
      // =========================
      const val = await validateKey(key);

      results.push(`📦 Validate: ${val.ok ? 'OK' : val.reason}`);

      // =========================
      // APPLY
      // =========================
      let applyResult = { ok: false, reason: 'SKIPPED' };

      if (val.ok) {
        applyResult = await applyLicenseKey(guildId, userId, key);
      }

      results.push(`⚙️ Apply: ${applyResult.ok ? 'OK' : applyResult.reason}`);

      // =========================
      // REVOKE
      // =========================
      const revoke = await revokeLicense(guildId);

      results.push(`♻️ Revoke: ${revoke.ok ? 'OK' : 'FAIL'}`);

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
