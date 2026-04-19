import { SlashCommandBuilder } from 'discord.js';
import { generateLicenseKey, validateKey } from '../services/licenseStore.js';
import { applyLicenseKey, revokeLicense } from '../services/unichatCore.js';
import { checkFraud } from '../services/fraudCheck.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('FULL system stress test (OWNER ONLY)'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (userId !== process.env.OWNER_ID) {
      return interaction.editReply('❌ Owner only command');
    }

    const results = [];

    try {
      // ==============================
      // 1. FRAUD STRESS TEST
      // ==============================
      let fraudBlocks = 0;

      for (let i = 0; i < 10; i++) {
        const f = checkFraud({
          userId,
          ownerId: process.env.OWNER_ID,
          code: 'STRESS_CODE',
          guildId
        });

        if (!f.ok) fraudBlocks++;
      }

      results.push(`🛡 Fraud Stress: ${fraudBlocks}/10 blocked (expected >0)`);

      // ==============================
      // 2. GENERATION STRESS TEST
      // ==============================
      const keys = [];

      for (let i = 0; i < 5; i++) {
        const res = await generateLicenseKey('7day', 7);
        keys.push(res.key || res);
      }

      results.push(`🔑 Key Gen: ${keys.length}/5 generated`);

      // ==============================
      // 3. VALIDATION STRESS TEST
      // ==============================
      let validCount = 0;

      for (const key of keys) {
        const v = await validateKey(key);
        if (v.ok) validCount++;
      }

      results.push(`📦 Validation: ${validCount}/5 valid`);

      // ==============================
      // 4. APPLY + REVOKE LOOP TEST
      // ==============================
      let applyOk = 0;
      let revokeOk = 0;

      for (const key of keys) {
        const apply = await applyLicenseKey(guildId, userId, key);

        if (apply.ok) applyOk++;

        const revoke = await revokeLicense(guildId);

        if (revoke) revokeOk++;
      }

      results.push(`⚙️ Apply Cycle: ${applyOk}/5 OK`);
      results.push(`♻️ Revoke Cycle: ${revokeOk}/5 OK`);

      // ==============================
      // 5. DUPLICATE KEY TEST
      // ==============================
      const dupKey = keys[0];

      const dup1 = await validateKey(dupKey);
      const dup2 = await validateKey(dupKey);

      results.push(`🔁 Duplicate Check: ${dup1.ok && dup2.ok ? 'OK (stable)' : 'ISSUE'}`);

      // ==============================
      // 6. STRESS SUMMARY
      // ==============================
      const passed =
        fraudBlocks >= 1 &&
        validCount === keys.length &&
        applyOk > 0;

      results.push(`\n🔥 SYSTEM STATUS: ${passed ? 'STABLE' : 'UNSTABLE'}`);

      return interaction.editReply(
        `🧪 FULL STRESS TEST COMPLETE\n\n` +
        results.join('\n')
      );

    } catch (err) {
      console.log('STRESS TEST ERROR:', err);
      return interaction.editReply('❌ Stress test failed (check logs)');
    }
  }
};
