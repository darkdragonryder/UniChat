import { SlashCommandBuilder } from 'discord.js';

import { generateLicenseKey, validateKey, revokeLicense } from '../services/licenseStore.js';
import { applyLicenseKey } from '../services/unichatCore.js';
import { checkFraud, resetFraudData } from '../services/fraudCheck.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('System diagnostics test'),

  async execute(interaction) {
    console.log("TEST START");

    try {
      await interaction.deferReply({ ephemeral: true });

      const guildId = interaction.guild.id;
      const userId = interaction.user.id;

      const results = [];

      // =========================
      // FRAUD TEST
      // =========================
      let blocked = 0;
      const fakeUser = `test-${Date.now()}`;

      for (let i = 0; i < 5; i++) {
        const fraud = checkFraud({
          userId: fakeUser,
          ownerId: process.env.OWNER_ID,
          code: 'TEST',
          guildId
        });

        if (!fraud.ok) blocked++;
      }

      results.push(`🛡 Fraud: ${blocked}/5 blocked`);

      // =========================
      // GENERATE
      // =========================
      const gen = await generateLicenseKey('7day', 7);
      const key = gen.key;

      results.push(`🔑 Generate: OK`);

      // =========================
      // VALIDATE
      // =========================
      const val = await validateKey(key);
      results.push(`📦 Validate: ${val.ok ? 'OK' : val.reason}`);

      // =========================
      // APPLY
      // =========================
      let apply = { ok: false, reason: 'SKIPPED' };

      if (val.ok) {
        apply = await applyLicenseKey(guildId, userId, key);
      }

      results.push(`⚙️ Apply: ${apply.ok ? 'OK' : apply.reason}`);

      // =========================
      // REVOKE
      // =========================
      const revoke = await revokeLicense(guildId);
      results.push(`♻️ Revoke: ${revoke.ok ? 'OK' : 'FAIL'}`);

      resetFraudData(userId);

      // =========================
      // OUTPUT
      // =========================
      return interaction.editReply(
        `🧪 SYSTEM TEST\n\n` +
        results.map(r => `• ${r}`).join('\n') +
        `\n\n✅ Complete`
      );

    } catch (err) {
      console.log("TEST ERROR:", err);
      return interaction.reply({
        content: "❌ Test failed (check logs)",
        ephemeral: true
      });
    }
  }
};
