import { systemHealth } from "../services/systemHealth.js";

export default (client) => async (guild) => {
  try {

    console.log(`📥 New guild joined: ${guild.name}`);

    // ================= AUTO HEALTH CHECK =================
    await systemHealth({ guild });

    // OPTIONAL: could auto-run setup later if you want full automation
    // (kept disabled to avoid unwanted channel creation)

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
};
