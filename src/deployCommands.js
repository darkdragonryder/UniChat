import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { commandData as setLanguageData } from "./commands/setlanguage.js";

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup UniChat"),

  new SlashCommandBuilder()
    .setName("uninstall")
    .setDescription("Remove UniChat system"),

  setLanguageData
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🚀 Deploying commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commands deployed");
  } catch (err) {
    console.log("❌ Deploy error:", err);
  }
})();
