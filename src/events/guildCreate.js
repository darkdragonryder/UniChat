import { systemHealth } from "../services/systemHealth.js";

export default () => async (guild) => {
  try {
    console.log(`📥 New guild joined: ${guild.name}`);

    await systemHealth({ guild });

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err?.message || err);
  }
};
