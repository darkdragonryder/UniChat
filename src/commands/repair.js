import { syncLanguagePermissions } from "../utils/syncPermissions.js";

export default async function repairCommand(interaction) {
  try {

    await interaction.deferReply({ ephemeral: true });

    await syncLanguagePermissions(interaction.guild);

    return interaction.editReply("✅ Permissions repaired successfully");

  } catch (err) {
    console.log("REPAIR ERROR:", err.message);

    return interaction.editReply("❌ Repair failed");
  }
}
