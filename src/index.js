import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";

// IMPORTANT FIX: named import
import { translateCached } from "./services/cacheTranslate.js";

// Commands
import setupCommand, { runFinalSetup } from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";
import migrateCommand from "./commands/migrate.js";

// Events
import guildMemberAdd from "./events/guildMemberAdd.js";
import guildCreate from "./events/guildCreate.js";

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

client.tempSetup = {};

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 UniChat ONLINE: ${client.user.tag}`);
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {

    // ================= SLASH COMMANDS =================
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {

        case "setup":
          return setupCommand(interaction);

        case "uninstall":
          return uninstallCommand(interaction);

        case "setlanguage":
          return setLanguageCommand(interaction);

        case "help":
          return helpCommand(interaction);

        case "info":
          return infoCommand(interaction, client);

        case "migrate":
          return migrateCommand(interaction);

        case "announce-owner":
          return interaction.reply("🌏 UniChat created by **Dr4gonwolf**");
      }
    }

    // ================= SETUP FLOW =================
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

    // ================= LANGUAGE SELECT =================
    if (interaction.isStringSelectMenu() && interaction.customId === "setup_languages") {

      client.tempSetup[interaction.guild.id] = {
        langs: interaction.values
      };

      const modal = new ModalBuilder()
        .setCustomId("setup_preview_input")
        .setTitle("🌐 Translation Preview");

      const input = new TextInputBuilder()
        .setCustomId("preview_text")
        .setLabel("Enter preview message")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // ================= PREVIEW =================
    if (interaction.isModalSubmit() && interaction.customId === "setup_preview_input") {

      const previewText = interaction.fields.getTextInputValue("preview_text");
      const setup = client.tempSetup[interaction.guild.id];

      if (!setup?.langs) {
        return interaction.reply({ content: "❌ Setup expired", ephemeral: true });
      }

      const results = await Promise.all(
        setup.langs.map(async (lang) => {
          const translated = await translateCached(previewText, lang);
          return `${lang}: ${translated}`;
        })
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("setup_confirm")
          .setLabel("Confirm Setup")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: "🌐 Preview:\n\n" + results.join("\n"),
        components: [row],
        ephemeral: true
      });
    }

    // ================= FINAL =================
    if (interaction.isButton() && interaction.customId === "setup_confirm") {

      const setup = client.tempSetup[interaction.guild.id];

      if (!setup?.langs) {
        return interaction.reply({ content: "❌ Setup expired", ephemeral: true });
      }

      await interaction.update({
        content: "⚙️ Setting up UniChat...",
        components: []
      });

      await runFinalSetup(interaction.guild, client, setup.langs, interaction);

      delete client.tempSetup[interaction.guild.id];

      return interaction.followUp({
        content: "✅ Setup complete!",
        ephemeral: true
      });
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
