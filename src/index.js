import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} from "discord.js";

import { runFinalSetup } from "./commands/setup.js";
import { translateCached } from "./services/cacheTranslate.js";

// Commands
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";

// Events
import guildMemberAdd from "./events/guildMemberAdd.js";
import guildCreate from "./events/guildCreate.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// TEMP STORAGE
client.tempSetup = {};

// LANGUAGE EMOJIS
const langEmojis = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  KO: "🇰🇷",
  RU: "🇷🇺",
  JA: "🇯🇵"
};

// READY
client.once("ready", () => {
  console.log(`🚀 UniChat Bot is ONLINE: ${client.user.tag}`);
});

// EVENTS
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {

    // ================= SLASH =================
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case "setup": return setupCommand(interaction);
        case "uninstall": return uninstallCommand(interaction);
        case "setlanguage": return setLanguageCommand(interaction);
        case "help": return helpCommand(interaction);
        case "info": return infoCommand(interaction, client);
        case "announce-owner":
          return interaction.reply("🌏 UniChat created by **Dr4gonwolf**");
      }
    }

    // ================= STEP 1 =================
    if (interaction.isButton() && interaction.customId === "setup_start") {

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("setup_languages")
          .setPlaceholder("Select languages")
          .setMinValues(1)
          .setMaxValues(5)
          .addOptions([
            { label: "Spanish", value: "ES" },
            { label: "German", value: "DE" },
            { label: "Italian", value: "IT" },
            { label: "Japanese", value: "JA" },
            { label: "Korean", value: "KO" }
          ])
      );

      return interaction.update({
        content: "🌍 Select languages",
        components: [row],
        embeds: []
      });
    }

    // ================= STEP 2 (LIVE PREVIEW) =================
    if (interaction.isStringSelectMenu() && interaction.customId === "setup_languages") {

      const langs = interaction.values;

      client.tempSetup[interaction.guild.id] = langs;

      const previewText = "Hello everyone";

      let preview = "🌐 **Live Translation Preview**\n\n";

      const results = await Promise.all(
        langs.map(async (lang) => {
          try {
            const translated = await translateCached(previewText, lang);
            return `${langEmojis[lang] || lang} ${translated}`;
          } catch {
            return `${langEmojis[lang] || lang} ❌ failed`;
          }
        })
      );

      preview += results.join("\n");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("setup_confirm")
          .setLabel("Confirm Setup")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.update({
        content: preview,
        components: [row]
      });
    }

    // ================= FINAL =================
    if (interaction.isButton() && interaction.customId === "setup_confirm") {

      const langs = client.tempSetup[interaction.guild.id];

      if (!langs) {
        return interaction.reply({ content: "❌ Setup expired", ephemeral: true });
      }

      await interaction.update({
        content: "⚙️ Creating UniChat...",
        components: []
      });

      await runFinalSetup(interaction.guild, client, langs);

      delete client.tempSetup[interaction.guild.id];

      return interaction.followUp("✅ UniChat setup complete!");
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
