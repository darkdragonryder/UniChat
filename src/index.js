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

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

// Commands
import setupCommand, { runFinalSetup } from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";
import migrateCommand from "./commands/migrate.js";

import guildCreate from "./events/guildCreate.js";
import guildMemberAdd from "./events/guildMemberAdd.js";

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

// ================= TRANSLATION ENGINE =================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;

    if (!channels) return;

    let sourceLang = null;

    for (const [lang, id] of Object.entries(channels)) {
      if (message.channel.id === id) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    // ================= TRANSLATE TO ALL OTHER CHANNELS =================
    for (const [lang, id] of Object.entries(channels)) {
      if (lang === sourceLang) continue;

      const translated = await translateCached(message.content, lang);
      if (!translated) continue;

      const channel = await message.guild.channels.fetch(id).catch(() => null);
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
        case "setup": return setupCommand(interaction);
        case "uninstall": return uninstallCommand(interaction);
        case "setlanguage": return setLanguageCommand(interaction);
        case "help": return helpCommand(interaction);
        case "info": return infoCommand(interaction, client);
        case "migrate": return migrateCommand(interaction);
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
        .setTitle("Preview");

      const input = new TextInputBuilder()
        .setCustomId("preview_text")
        .setLabel("Message")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === "setup_preview_input") {

      const setup = client.tempSetup[interaction.guild.id];
      const text = interaction.fields.getTextInputValue("preview_text");

      const results = await Promise.all(
        setup.langs.map(l => translateCached(text, l))
      );

      return interaction.reply({
        content: results.join("\n"),
        ephemeral: true
      });
    }

    if (interaction.isButton() && interaction.customId === "setup_confirm") {

      const setup = client.tempSetup[interaction.guild.id];

      await interaction.update({
        content: "⚙️ Setting up...",
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
