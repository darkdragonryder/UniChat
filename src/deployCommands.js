import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

import setLanguageData from "./commands/setlanguage.js"; // ✅ FIXED

const commands = [
  new SlashCommandBuilder().setName("info").setDescription("Show bot information"),
  new SlashCommandBuilder().setName("help").setDescription("Show help information"),
  new SlashCommandBuilder().setName("setup").setDescription("Setup UniChat"),
  new SlashCommandBuilder().setName("uninstall").setDescription("Remove UniChat"),
  new SlashCommandBuilder().setName("announce-owner").setDescription("Announce UniChat creator"),
  setLanguageData
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🚀 Registering slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("❌ Command registration failed:", err);
  }
})();
