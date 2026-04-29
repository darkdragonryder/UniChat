import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from "discord.js";

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";
import { systemHealth } from "./services/systemHealth.js";

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
client.once("ready", async () => {
  console.log(`🚀 UniChat v4.0.1 ONLINE: ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await systemHealth({ guild }).catch(() => {});
  }
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

/* =========================================================
   MESSAGE CREATE (FIXED)
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

    const messageMap = {};
    messageMap[sourceLang] = message.id;

    for (const [lang, channelId] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      const channel = await message.guild.channels.fetch(channelId).catch(() => null);
      if (!channel) continue;

      const translated = await translateCached(message.content, lang);
      if (!translated) continue;

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setAuthor({
          name: message.member?.displayName || message.author.username,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(translated)
        .setFooter({ text: `🌍 ${sourceLang} → ${lang}` })
        .setTimestamp();

      const sent = await channel.send({ embeds: [embed] }).catch(() => null);

      if (sent) {
        messageMap[lang] = sent.id;
      }
    }

    // ================= SAVE MAP (WITH DEBUG) =================
    const { error } = await supabase.from("message_maps").insert({
      guild_id: message.guild.id,
      base_message_id: message.id,
      channel_map: messageMap
    });

    if (error) {
      console.log("❌ MAP SAVE ERROR FULL:", error);
    } else {
      console.log("✅ MAP SAVED:", message.id);
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

/* =========================================================
   MESSAGE EDIT
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

    const map = data.channel_map;

    for (const msgId of Object.values(map)) {

      for (const channel of newMsg.guild.channels.cache.values()) {

        const msg = await channel.messages.fetch(msgId).catch(() => null);

        if (msg) {
          await msg.edit({ content: newMsg.content }).catch(() => {});
          break;
        }
      }
    }

  } catch (err) {
    console.log("EDIT ERROR:", err.message);
  }
});

/* =========================================================
   MESSAGE DELETE
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

    const map = data.channel_map;

    for (const msgId of Object.values(map)) {

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
   COMMANDS
========================================================= */
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {
      case "setup": return setupCommand(interaction, client);
      case "uninstall": return uninstallCommand(interaction);
      case "setlanguage": return setLanguageCommand(interaction);
      case "help": return helpCommand(interaction);
      case "info": return infoCommand(interaction, client);
      case "migrate": return migrateCommand(interaction);
      case "addlanguage": return addLanguageCommand(interaction);
      case "repair": return repairCommand(interaction);
      case "unlock": return unlockCommand(interaction);
      case "announce-owner": return announceOwnerCommand(interaction, client);
      case "diagnose": return diagnoseCommand(interaction, client);
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
