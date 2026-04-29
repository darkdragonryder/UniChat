import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from "discord.js";

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

// ================= COMMANDS =================
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

// ================= EVENTS =================
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

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 UniChat v4 ONLINE: ${client.user.tag}`);
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

/* =========================================================
   MESSAGE DELETE SYNC
========================================================= */
client.on("messageDelete", async (message) => {
  try {
    if (!message.guild) return;

    const { data } = await supabase
      .from("message_maps")
      .select("*")
      .eq("guild_id", message.guild.id)
      .eq("base_message_id", message.id)
      .maybeSingle();

    if (!data) return;

    const map = data.channel_map;

    for (const msgId of Object.values(map)) {
      const channels = message.guild.channels.cache;

      for (const channel of channels.values()) {
        const msg = await channel.messages.fetch(msgId).catch(() => null);
        if (msg) await msg.delete().catch(() => {});
      }
    }

    await supabase
      .from("message_maps")
      .delete()
      .eq("base_message_id", message.id);

  } catch (err) {
    console.log("DELETE SYNC ERROR:", err.message);
  }
});

/* =========================================================
   MESSAGE UPDATE SYNC
========================================================= */
client.on("messageUpdate", async (oldMsg, newMsg) => {
  try {

    if (!newMsg.guild || newMsg.author?.bot) return;

    const { data } = await supabase
      .from("message_maps")
      .select("*")
      .eq("guild_id", newMsg.guild.id)
      .eq("base_message_id", newMsg.id)
      .maybeSingle();

    if (!data) return;

    const map = data.channel_map;

    for (const [lang, msgId] of Object.entries(map)) {

      if (lang === "EN") continue;

      const translated = await translateCached(newMsg.content, lang);

      for (const channel of newMsg.guild.channels.cache.values()) {
        const msg = await channel.messages.fetch(msgId).catch(() => null);
        if (!msg) continue;

        await msg.edit({
          content: translated
        }).catch(() => {});
      }
    }

  } catch (err) {
    console.log("EDIT SYNC ERROR:", err.message);
  }
});

// ================= TRANSLATION + ROLE ENGINE =================
client.on("messageCreate", async (message) => {
  try {

    if (!message.guild || message.author.bot) return;
    if (!message.content?.trim()) return;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;
    if (!channels) return;

    let sourceLang = null;

    for (const [lang, id] of Object.entries(channels)) {
      if (String(message.channel.id) === String(id)) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    // ================= AUTO ROLE =================
    const roleMap = {
      EN: "English",
      ES: "Spanish",
      DE: "German",
      IT: "Italian",
      KO: "Korean",
      RU: "Russian",
      JA: "Japanese"
    };

    const roleName = roleMap[sourceLang];

    if (roleName && message.member) {

      const role = message.guild.roles.cache.find(r => r.name === roleName);

      if (role && !message.member.roles.cache.has(role.id)) {

        for (const r of message.member.roles.cache.values()) {
          if (Object.values(roleMap).includes(r.name)) {
            await message.member.roles.remove(r).catch(() => {});
          }
        }

        await message.member.roles.add(role).catch(() => {});
      }
    }

    // ================= TRANSLATION + MAP STORE =================
    const channelMap = {
      [sourceLang]: message.id
    };

    for (const [lang, id] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      const channel = await message.guild.channels.fetch(id).catch(() => null);
      if (!channel) continue;

      const translated = await translateCached(message.content, lang);
      if (!translated) continue;

      const sent = await channel.send({
        content: translated
      }).catch(() => null);

      if (sent) {
        channelMap[lang] = sent.id;
      }
    }

    // SAVE MESSAGE MAP
    await supabase.from("message_maps").insert({
      guild_id: message.guild.id,
      base_message_id: message.id,
      channel_map: channelMap
    });

  } catch (err) {
    console.log("TRANSLATION ERROR:", err.message);
  }
});

// ================= COMMANDS =================
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
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
