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

import setupCommand, { runFinalSetup } from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";
import migrateCommand from "./commands/migrate.js";

import guildMemberAdd from "./events/guildMemberAdd.js";
import guildCreate from "./events/guildCreate.js";

import { supabase } from "./services/supabase.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= DB HELPERS =================
async function getSetup(guildId) {
  const { data } = await supabase
    .from("guild_setup_sessions")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  return data;
}

async function saveSetup(guildId, payload) {
  await supabase.from("guild_setup_sessions").upsert({
    guild_id: guildId,
    ...payload,
    updated_at: new Date().toISOString()
  });
}

async function deleteSetup(guildId) {
  await supabase
    .from("guild_setup_sessions")
    .delete()
    .eq("guild_id", guildId);
}

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

    const map = data?.enabled_channels;
    if (!map) return;

    let lang = null;

    for (const [l, id] of Object.entries(map)) {
      if (id === message.channel.id) lang = l;
    }

    if (!lang) return;

    const translated = await translateCached(message.content, lang);
    if (!translated || translated === message.content) return;

    await message.channel.send(`🌍 ${translated}`);

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

    // ================= STEP 1 =================
    if (interaction.isButton() && interaction.customId === "setup_start") {

      await saveSetup(interaction.guild.id, {
        user_id: interaction.user.id,
        step: "langs"
      });

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

    // ================= LANG SELECT =================
    if (interaction.isStringSelectMenu() && interaction.customId === "setup_languages") {

      await saveSetup(interaction.guild.id, {
        langs: interaction.values,
        step: "preview"
      });

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

    // ================= PREVIEW =================
    if (interaction.isModalSubmit() && interaction.customId === "setup_preview_input") {

      const text = interaction.fields.getTextInputValue("preview_text");

      await saveSetup(interaction.guild.id, {
        preview_text: text
      });

      const setup = await getSetup(interaction.guild.id);
      if (!setup?.langs) {
        return interaction.reply({ content: "Setup expired", ephemeral: true });
      }

      const results = await Promise.all(
        setup.langs.map(async (l) => {
          const t = await translateCached(text, l);
          return `${l}: ${t}`;
        })
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("setup_confirm")
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: results.join("\n"),
        components: [row],
        ephemeral: true
      });
    }

    // ================= CONFIRM =================
    if (interaction.isButton() && interaction.customId === "setup_confirm") {

      const setup = await getSetup(interaction.guild.id);

      if (!setup?.langs) {
        return interaction.reply({
          content: "❌ Setup expired",
          ephemeral: true
        });
      }

    // 🔥 STEP 1: update loading message
    await interaction.update({
      content: "⚙️ Setting up UniChat...",
      components: []
    });

    // 🔥 STEP 2: run setup
    await runFinalSetup(
      interaction.guild,
      client,
      setup.langs,
      interaction
    );

    // 🔥 STEP 3: cleanup
    await deleteSetup(interaction.guild.id);

    // 🔥 STEP 4: FINAL CONFIRM MESSAGE (THIS WAS MISSING)
    return interaction.followUp({
      content: "✅ Setup complete! UniChat is now active.",
      ephemeral: true
    });
  }

  } catch (err) {
    console.log("INTERACTION ERROR:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
