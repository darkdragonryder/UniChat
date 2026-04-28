import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from "discord.js";

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

// Commands
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";
import migrateCommand from "./commands/migrate.js";
import addLanguageCommand from "./commands/addlanguage.js";
import repairCommand from "./commands/repair.js";
import unlockCommand from "./commands/channel/unlock.js";
import announceOwnerCommand from "./commands/announce-owner.js";

// Events
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

client.once("ready", () => {
  console.log(`🚀 UniChat v4 ONLINE: ${client.user.tag}`);
});

client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= DEBUG TRANSLATION ENGINE =================
client.on("messageCreate", async (message) => {
  try {

    if (!message.guild || message.author.bot) return;

    if (!message.content || message.content.trim() === "") {
      console.log("❌ Empty message");
      return;
    }

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;

    console.log("📊 DB CHANNELS:", channels);
    console.log("📨 MESSAGE CHANNEL:", message.channel.id);

    if (!channels || typeof channels !== "object") {
      console.log("❌ No channels found in DB");
      return;
    }

    let sourceLang = null;

    console.log("🔍 Checking channel match...");

    for (const [lang, id] of Object.entries(channels)) {
      console.log(`Comparing ${message.channel.id} === ${id} (${lang})`);

      if (String(message.channel.id) === String(id)) {
        console.log("✅ MATCH FOUND:", lang);
        sourceLang = lang;
      }
    }

    if (!sourceLang) {
      console.log("❌ No source language detected");
      return;
    }

    for (const [lang, id] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      const channel = await message.guild.channels.fetch(id).catch(() => null);
      if (!channel) {
        console.log("❌ Target channel missing:", id);
        continue;
      }

      console.log(`🌐 Translating to ${lang}:`, message.content);

      const translated = await translateCached(message.content, lang);

      console.log("📥 Result:", translated);

      if (!translated) {
        console.log("❌ Translation failed");
        continue;
      }

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setAuthor({
          name: message.member?.displayName || message.author.username,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(translated)
        .setFooter({
          text: `🌍 ${sourceLang} → ${lang}`
        })
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
    }

  } catch (err) {
    console.log("TRANSLATION ERROR:", err);
  }
});

// ================= COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isChatInputCommand()) return;

    console.log("COMMAND RUN:", interaction.commandName);

    switch (interaction.commandName) {

      case "setup":
        return setupCommand(interaction, client);

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

      case "addlanguage":
        return addLanguageCommand(interaction);

      case "repair":
        return repairCommand(interaction);

      case "unlock":
        return unlockCommand(interaction);

      case "announce-owner":
        return announceOwnerCommand(interaction, client);
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
