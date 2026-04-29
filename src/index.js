import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from "discord.js";

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";
import { enqueue } from "./services/queue.js";
import { autoHeal } from "./services/autoHeal.js";

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
import diagnoseCommand from "./commands/diagnose.js";

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
  console.log(`🚀 UniChat v4 ENTERPRISE ONLINE: ${client.user.tag}`);
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

/* =========================================================
   MESSAGE ENGINE (TRANSLATION + AUTO ROLE)
========================================================= */
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

    /* ================= ROLE AUTO ASSIGN (NO ENGLISH ROLE) ================= */
    const roleMap = {
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
        await message.member.roles.add(role).catch(() => {});
      }
    }

    /* ================= QUEUE TRANSLATION ================= */
    enqueue({
      message,
      channels,
      sourceLang,
      translateCached,
      supabase
    });

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

/* =========================================================
   MESSAGE DELETE SYNC
========================================================= */
client.on("messageDelete", async (message) => {
  try {

    const { data } = await supabase
      .from("message_maps")
      .select("channel_map")
      .eq("guild_id", message.guild.id)
      .eq("base_message_id", message.id)
      .maybeSingle();

    if (!data?.channel_map) return;

    for (const msgId of Object.values(data.channel_map)) {
      for (const channel of message.guild.channels.cache.values()) {
        const msg = await channel.messages.fetch(msgId).catch(() => null);
        if (msg) {
          await msg.delete().catch(() => {});
          break;
        }
      }
    }

    await supabase
      .from("message_maps")
      .delete()
      .eq("guild_id", message.guild.id)
      .eq("base_message_id", message.id);

  } catch (err) {
    console.log("DELETE ERROR:", err.message);
  }
});

/* =========================================================
   MESSAGE EDIT SYNC
========================================================= */
client.on("messageUpdate", async (oldMsg, newMsg) => {
  try {

    if (!newMsg.guild || newMsg.author?.bot) return;

    const { data } = await supabase
      .from("message_maps")
      .select("channel_map")
      .eq("guild_id", newMsg.guild.id)
      .eq("base_message_id", newMsg.id)
      .maybeSingle();

    if (!data?.channel_map) return;

    for (const [lang, msgId] of Object.entries(data.channel_map)) {
      if (lang === "EN") continue;

      const translated = await translateCached(newMsg.content, lang);

      for (const channel of newMsg.guild.channels.cache.values()) {
        const msg = await channel.messages.fetch(msgId).catch(() => null);

        if (msg) {
          await msg.edit({ content: translated }).catch(() => {});
          break;
        }
      }
    }

  } catch (err) {
    console.log("EDIT ERROR:", err.message);
  }
});

/* =========================================================
   INTERACTION COMMANDS
========================================================= */
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

      case "diagnose":
        return diagnoseCommand(interaction, client);
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

/* =========================================================
   STARTUP AUTO HEAL (SAFE CHECK ONLY)
========================================================= */
client.once("ready", async () => {
  try {
    for (const guild of client.guilds.cache.values()) {
      await autoHeal({ guild, client });
    }
  } catch (err) {
    console.log("AUTO HEAL INIT ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
