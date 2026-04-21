import { SlashCommandBuilder } from 'discord.js';
import { generateLicenseKey, validateKey, useKey } from '../services/licenseStore.js';
import { applyLicenseKey } from '../services/unichatCore.js';
import { checkFraud } from '../services/fraudCheck.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Advanced system diagnostic'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const results = [];

    const time = (label, fn) => {
      const start = Date.now();
      const res = fn();
      const ms = Date.now() - start;
      return { res, ms, label };
    };

    try {
      // =========================
      // FRAUD
      // =========================
      const fraudStart = Date.now();
      const fraud = checkFraud({
        userId,
        ownerId: process.env.OWNER_ID,
        code: 'DIAG_V2',
        guildId
      });
      results.push(`🛡 Fraud: ${fraud.ok ? 'PASS' : fraud.reason} (${Date.now() - fraudStart}ms)`);

      // =========================
      // GENERATE
      // =========================
      const genStart = Date.now();
      const { key } = await generateLicenseKey('7day', 7);
      results.push(`🔑 Generate: OK (${Date.now() - genStart}ms)`);

      // =========================
      // VALIDATE
      // =========================
      const valStart = Date.now();
      const validate = await validateKey(key);
      results.push(`📦 Validate: ${validate.ok ? 'PASS' : validate.reason} (${Date.now() - valStart}ms)`);

      // =========================
      // APPLY
      // =========================
      const appStart = Date.now();
      const apply = await applyLicenseKey(guildId, userId, key);
      results.push(`⚙ Apply: ${apply.ok ? 'PASS' : apply.reason} (${Date.now() - appStart}ms)`);

      // =========================
      // USE KEY
      // =========================
      const useStart = Date.now();
      if (validate.ok) {
        await useKey(key, guildId, userId);
        results.push(`🔐 UseKey: PASS (${Date.now() - useStart}ms)`);
      }

      return interaction.editReply(
        `🧪 **DIAGNOSTIC v2 COMPLETE**\n\n` +
        results.map(r => `• ${r}`).join('\n') +
        `\n\n✅ System Healthy`
      );

    } catch (err) {
      console.error(err);
      return interaction.editReply(`❌ FAILED:\n\`\`\`${err.message}\`\`\``);
    }
  }
};
