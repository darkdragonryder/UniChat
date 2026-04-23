import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand, { commandData as setLanguageData } from "./commands/setlanguage.js";

// ================= COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup UniChat"),

  new SlashCommandBuilder()
    .setName("uninstall")
    .setDescription("Remove UniChat system"),

  setLanguageData
].map(cmd => cmd.toJSON());

// ================= DEPLOY =================
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🚀 Deploying slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands deployed successfully");
  } catch (err) {
    console.log("❌ Deploy failed:", err);
  }
})();
