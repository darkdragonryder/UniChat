async execute(interaction) {
  const startTime = Date.now();

  await interaction.deferReply({ ephemeral: true });

  try {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.editReply('❌ Owner only');
    }

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const results = [];

    // =========================
    // FRAUD TEST
    // =========================
    try {
      let blocked = 0;
      const testUserId = `test-${Date.now()}`;

      for (let i = 0; i < 5; i++) {
        const fraud = checkFraud({
          userId: testUserId,
          ownerId: process.env.OWNER_ID,
          code: 'TEST_CODE',
          guildId
        });

        if (!fraud.ok) blocked++;
      }

      results.push(`🛡 Fraud stress: ${blocked}/5 blocked`);
    } catch (err) {
      console.log("FRAUD ERROR:", err);
      results.push("🛡 Fraud stress: ERROR");
    }

    // =========================
    // GENERATE
    // =========================
    let key;
    try {
      const gen = await generateLicenseKey('7day', 7);
      key = gen.key;
      results.push(`🔑 Generate: OK`);
    } catch (err) {
      console.log("GENERATE ERROR:", err);
      results.push(`🔑 Generate: FAIL`);
    }

    // =========================
    // VALIDATE
    // =========================
    let val;
    try {
      val = await validateKey(key);
      results.push(`📦 Validate: ${val.ok ? 'OK' : val.reason}`);
    } catch (err) {
      console.log("VALIDATE ERROR:", err);
      results.push(`📦 Validate: ERROR`);
    }

    // =========================
    // APPLY
    // =========================
    let applyResult = { ok: false, reason: 'SKIPPED' };
    try {
      if (val?.ok) {
        applyResult = await applyLicenseKey(guildId, userId, key);
      }
      results.push(`⚙️ Apply: ${applyResult.ok ? 'OK' : applyResult.reason}`);
    } catch (err) {
      console.log("APPLY ERROR:", err);
      results.push(`⚙️ Apply: ERROR`);
    }

    // =========================
    // REVOKE
    // =========================
    try {
      const revoke = await revokeLicense(guildId);
      results.push(`♻️ Revoke: ${revoke.ok ? 'OK' : 'FAIL'}`);
    } catch (err) {
      console.log("REVOKE ERROR:", err);
      results.push(`♻️ Revoke: ERROR`);
    }

    const duration = Date.now() - startTime;
    results.push(`⚡ Execution: ${duration}ms`);

    return interaction.editReply(
      `🧪 **SYSTEM DIAGNOSTICS**\n\n` +
      results.map(r => `• ${r}`).join('\n') +
      `\n\n✅ Complete`
    );

  } catch (err) {
    console.log("TEST FATAL ERROR:", err);
    return interaction.editReply('❌ Test crashed (check logs)');
  }
}
