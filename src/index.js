import "dotenv/config";
import {
  Client,
  GatewayIntentBits
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

// ================= MEMORY CACHE =================
const channelCache = new Map(); // guildId → channels
const messageMap = new Map();   // syncId → { lang → messageId }

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 UniChat v3 SYNC ONLINE: ${client.user.tag}`);
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= LOAD CHANNELS =================
async function getChannels(guildId) {

  if (channelCache.has(guildId)) {
    return channelCache.get(guildId);
  }

  const { data } = await supabase
    .from("guild_settings")
    .select("enabled_channels")
    .eq("guild_id", guildId)
    .maybeSingle();

  const channels = data?.enabled_channels || {};
  channelCache.set(guildId, channels);

  return channels;
}

// ================= MESSAGE SYNC ENGINE v3 =================
client.on("messageCreate", async (message) => {
  try {

    if (!message.guild || message.author.bot) return;

    // ================= LOOP PROTECTION =================
    if (message.content.includes("UNI_CHAT_V3")) return;

    const channels = await getChannels(message.guild.id);
    if (!channels) return;

    // ================= DETECT SOURCE LANGUAGE =================
    let sourceLang = null;

    for (const [lang, id] of Object.entries(channels)) {
      if (message.channel.id === id) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    // ================= SYNC ID =================
    const syncId =
      message.id + "-" + Date.now().toString(36);

    messageMap.set(syncId, {});

    // ================= TRANSLATE TO ALL =================
    for (const [lang, channelId] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      const channel = await message.guild.channels.fetch(channelId)
        .catch(() => null);

      if (!channel) continue;

      const translated = await translateCached(message.content, lang);
      if (!translated) continue;

      const sent = await channel.send({
        content: `🌍 UNI_CHAT_V3 ${sourceLang} → ${lang}: ${translated}`
      }).catch(() => null);

      if (sent) {
        messageMap.get(syncId)[lang] = sent.id;
      }
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

// ================= EDIT SYNC =================
client.on("messageUpdate", async (oldMsg, newMsg) => {
  try {

    if (!newMsg.guild || newMsg.author?.bot) return;

    const channels = await getChannels(newMsg.guild.id);
    if (!channels) return;

    let sourceLang = null;

    for (const [lang, id] of Object.entries(channels)) {
      if (newMsg.channel.id === id) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    for (const [lang, channelId] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      const translated = await translateCached(newMsg.content, lang);
      if (!translated) continue;

      const channel = await newMsg.guild.channels.fetch(channelId)
        .catch(() => null);

      if (!channel) continue;

      await channel.send({
        content: `✏️ UPDATED 🌍 ${sourceLang} → ${lang}: ${translated}`
      }).catch(() => {});
    }

  } catch (err) {
    console.log("EDIT SYNC ERROR:", err.message);
  }
});

// ================= DELETE SYNC =================
client.on("messageDelete", async (message) => {
  try {

    if (!message.guild) return;

    const channels = await getChannels(message.guild.id);
    if (!channels) return;

    for (const channelId of Object.values(channels)) {

      const channel = await message.guild.channels.fetch(channelId)
        .catch(() => null);

      if (!channel) continue;

      // we cannot reliably fetch old messages without cache,
      // so we just notify deletion (safe fallback)

      await channel.send({
        content: `🗑️ A message was deleted in another language channel.`
      }).catch(() => {});
    }

  } catch (err) {
    console.log("DELETE SYNC ERROR:", err.message);
  }
});

// ================= COMMAND HANDLER =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isChatInputCommand()) return;

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
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
