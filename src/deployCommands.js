import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [

  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup UniChat in your server"),

  new SlashCommandBuilder()
    .setName("uninstall")
    .setDescription("Remove UniChat from your server"),

  new SlashCommandBuilder()
    .setName("setlanguage")
    .setDescription("Set your personal language")
    .addStringOption(option =>
      option
        .setName("language")
        .setDescription("Choose a language")
        .setRequired(true)
        .addChoices(
          { name: "English", value: "EN" },
          { name: "Spanish", value: "ES" },
          { name: "German", value: "DE" },
          { name: "Italian", value: "IT" },
          { name: "Korean", value: "KO" },
          { name: "Russian", value: "RU" },
          { name: "Japanese", value: "JA" }
        )
    ),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show help information"),

  new SlashCommandBuilder()
    .setName("info")
    .setDescription("Show bot dashboard"),

  new SlashCommandBuilder()
    .setName("migrate")
    .setDescription("Fix old channel structure"),

  new SlashCommandBuilder()
    .setName("announce-owner")
    .setDescription("Show bot creator info"),

  new SlashCommandBuilder()
    .setName("addlanguage")
    .setDescription("Add a new language channel + role")
    .addStringOption(o =>
      o.setName("code").setDescription("Language code").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("name").setDescription("Language name").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("emoji").setDescription("Flag emoji").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("repair")
    .setDescription("Fix channel permissions without reinstalling setup")
];

// ================= REST =================
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// ================= DEPLOY =================
(async () => {
  try {

    console.log("🚀 Deploying slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands.map(c => c.toJSON()) }
    );

    console.log("✅ Slash commands successfully deployed");

  } catch (err) {
    console.error("❌ Deploy failed:", err);
  }
})();
