import 'dotenv/config';
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
      // FRAUD TEST
      const fraud = checkFraud({
        userId,
        ownerId: process.env.OWNER_ID,
        code: 'TEST',
        guildId
      });

      results.push(`🛡 Fraud: ${fraud.ok ? 'OK' : fraud.reason}`);

      // GENERATE
      const gen = await generateLicenseKey('7day', 7);
      const key = gen.key;

      results.push(`🔑 Generated: OK`);

      // VALIDATE
      const val = await validateKey(key);
      results.push(`📦 Validate: ${val.ok ? 'OK' : 'FAIL'}`);

      // APPLY
      const apply = await applyLicenseKey(guildId, userId, key);
      results.push(`⚙️ Apply: ${apply.ok ? 'OK' : apply.reason}`);

      // REVOKE
      const revoke = await revokeLicense(guildId);
      results.push(`♻️ Revoke: ${revoke ? 'OK' : 'FAIL'}`);

      return interaction.editReply(
        `🧪 STRESS TEST\n\n` + results.join('\n')
      );

    } catch (err) {
      console.log(err);
      return interaction.editReply('❌ Test failed');
    }
  }
};
