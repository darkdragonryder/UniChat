async execute(interaction) {
  console.log("TEST START");

  try {
    await interaction.deferReply({ ephemeral: true });
    console.log("DEFER OK");

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const results = [];

    console.log("STEP 1 FRAUD");

    const fraud = checkFraud({
      userId: "debug-user",
      ownerId: process.env.OWNER_ID,
      code: "TEST",
      guildId
    });

    results.push(`Fraud: ${fraud.ok}`);

    console.log("STEP 2 GENERATE");

    const gen = await generateLicenseKey("7day", 7);
    results.push("Generate OK");

    console.log("STEP 3 VALIDATE");

    const val = await validateKey(gen.key);
    results.push(`Validate: ${val.ok}`);

    console.log("STEP 4 APPLY");

    const apply = await applyLicenseKey(guildId, userId, gen.key);
    results.push(`Apply: ${apply.ok}`);

    console.log("STEP 5 REVOKE");

    const revoke = await revokeLicense(guildId);
    results.push(`Revoke: ${revoke.ok}`);

    console.log("FINAL");

    return interaction.editReply(results.join("\n"));

  } catch (err) {
    console.log("TEST FAILED:", err);
    return interaction.reply({ content: "Crash detected (check logs)", ephemeral: true });
  }
}
