import "dotenv/config";
import { REST, Routes } from "discord.js";

const commands = [
  {
    name: "setup",
    description: "Setup UniChat system"
  },
  {
    name: "uninstall",
    description: "Remove UniChat system"
  }
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🚀 Deploying slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands deployed");
  } catch (err) {
    console.error("❌ Deploy failed:", err);
  }
})();
