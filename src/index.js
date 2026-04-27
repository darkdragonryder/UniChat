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

// ================= FIXED IMPORT PATHS =================
import { supabase } from "../services/supabase.js";
import { translateCached } from "../services/cacheTranslate.js";

// Commands
import setupCommand, { runFinalSetup } from "../commands/setup.js";
import uninstallCommand from "../commands/uninstall.js";
import setLanguageCommand from "../commands/setlanguage.js";
import helpCommand from "../commands/help.js";
import infoCommand from "../commands/info.js";
import migrateCommand from "../commands/migrate.js";

// Events
import guildCreate from "../events/guildCreate.js";
import guildMemberAdd from "../events/guildMemberAdd.js";

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
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

// ================= TRANSLATION ENGINE (FIXED & SAFE) =================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const { data, error } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (error) {
      console.log("DB ERROR:", error.message);
      return;
    }

    const channels = data?.enabled_channels;

    if (!channels || typeof channels !== "object") return;

    // ================= FIND SOURCE LANGUAGE =================
    let sourceLang = null;

    for (const [lang, id] of Object.entries(channels)) {
      if (message.channel.id === id) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    // ================= BROADCAST TRANSLATION =================
    for (const [lang, channelId] of Object.entries(channels)) {
      if (lang === sourceLang) continue;

      const translated = await translateCached(message.content, lang);
      if (!translated) continue;

      const channel = await message.guild.channels.fetch(channelId).catch(() => null);
      if (!channel) continue;

      await channel.send({
        content: `🌍 ${sourceLang} → ${lang}: ${translated}`
      }).catch(() => {});
    }

  } catch (err) {
    console.log("TRANSLATION ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {

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

    // ================= SETUP START =================
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
        .setTitle("Preview Translation");

      const input = new TextInputBuilder()
        .setCustomId("preview_text")
        .setLabel("Enter message")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // ================= PREVIEW =================
    if (interaction.isModalSubmit() && interaction.customId === "setup_preview_input") {

      const setup = client.tempSetup[interaction.guild.id];
      if (!setup?.langs) {
        return interaction.reply({ content: "❌ Setup expired", ephemeral: true });
      }

      const text = interaction.fields.getTextInputValue("preview_text");

      const results = await Promise.all(
        setup.langs.map(async (lang) => {
          const translated = await translateCached(text, lang);
          return `${lang}: ${translated}`;
        })
      );

      return interaction.reply({
        content: results.join("\n"),
        ephemeral: true
      });
    }

    // ================= FINAL SETUP =================
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
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
