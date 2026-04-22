import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const AUTO_DEPLOY = process.env.AUTO_DEPLOY === "true";

if (!AUTO_DEPLOY) {
  console.log("⚙️ AUTO_DEPLOY disabled — skipping slash command registration");
  process.exit(0);
}

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup UniChat system"),

  new SlashCommandBuilder()
    .setName("uninstall")
    .setDescription("Remove UniChat system")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 AUTO_DEPLOY enabled — registering commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered successfully");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
})();
