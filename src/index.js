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

import { supabase } from "./services/supabase.js";

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔥 GLOBAL CACHE
client.guildChannels = {};
client.tempSetup = {};

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 UniChat ONLINE: ${client.user.tag}`);
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= 🌍 TRANSLATION ENGINE =================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;

    let channels = client.guildChannels[message.guild.id];

    // 🔥 FALLBACK TO DB
    if (!channels) {
      const { data } = await supabase
        .from("guild_settings")
        .select("enabled_channels")
        .eq("guild_id", message.guild.id)
        .maybeSingle();

      channels = data?.enabled_channels;

      if (channels) {
        client.guildChannels[message.guild.id] = channels;
      }
    }

    if (!channels || typeof channels !== "object") return;

    let targetLang = null;

    for (const [lang, channelId] of Object.entries(channels)) {
      if (String(message.channel.id) === String(channelId)) {
        targetLang = lang;
        break;
      }
    }

    if (!targetLang) return;

    const translated = await translateCached(message.content, targetLang);

    if (!translated) return;
    if (translated === message.content && message.content.length < 10) return;

    await message.channel.send({
      content: `🌍 **Translated:** ${translated}`
    });

  } catch (err) {
    console.log("TRANSLATION ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case "setup": return setupCommand(interaction);
        case "uninstall": return uninstallCommand(interaction);
        case "setlanguage": return setLanguageCommand(interaction);
        case "help": return helpCommand(interaction);
        case "info": return infoCommand(interaction, client);
        case "migrate": return migrateCommand(interaction);
        case "announce-owner":
          return interaction.reply("🌏 UniChat created by **Dr4gonwolf**");
      }
    }

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
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

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
