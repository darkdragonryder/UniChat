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
  console.log(`🚀 UniChat v4.1 ONLINE: ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await systemHealth({ guild }).catch(() => {});
  }
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

/* =========================================================
   MESSAGE CREATE (WITH FULL MAPPING)
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

    const { error } = await supabase.from("message_maps").insert({
      guild_id: message.guild.id,
      base_message_id: message.id,
      channel_map: messageMap
    });

    if (error) {
      console.log("❌ MAP SAVE ERROR:", error);
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

/* =========================================================
   MESSAGE UPDATE (BIDIRECTIONAL)
========================================================= */
client.on("messageUpdate", async (oldMsg, newMsg) => {
  try {

    if (!newMsg.guild || newMsg.author?.bot) return;
    if (!newMsg.content) return;

    const { data: maps } = await supabase
      .from("message_maps")
      .select("*")
      .eq("guild_id", newMsg.guild.id);

    const record = maps?.find(m =>
      Object.values(m.channel_map || {}).includes(newMsg.id)
    );

    if (!record) return;

    const map = record.channel_map;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", newMsg.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;
    if (!channels) return;

    for (const [lang, msgId] of Object.entries(map)) {

      if (msgId === newMsg.id) continue;

      const channelId = channels[lang];
      if (!channelId) continue;

      const channel = await newMsg.guild.channels.fetch(channelId).catch(() => null);
      if (!channel) continue;

      const msg = await channel.messages.fetch(msgId).catch(() => null);
      if (!msg) continue;

      const translated = await translateCached(newMsg.content, lang);
      if (!translated) continue;

      await msg.edit({ content: translated }).catch(() => {});
    }

  } catch (err) {
    console.log("EDIT ERROR:", err.message);
  }
});

/* =========================================================
   MESSAGE DELETE (BIDIRECTIONAL)
========================================================= */
client.on("messageDelete", async (message) => {
  try {

    if (!message.guild || !message.id) return;

    const { data: maps } = await supabase
      .from("message_maps")
      .select("*")
      .eq("guild_id", message.guild.id);

    const record = maps?.find(m =>
      Object.values(m.channel_map || {}).includes(message.id)
    );

    if (!record) return;

    const map = record.channel_map;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;
    if (!channels) return;

    for (const [lang, msgId] of Object.entries(map)) {

      const channelId = channels[lang];
      if (!channelId) continue;

      const channel = await message.guild.channels.fetch(channelId).catch(() => null);
      if (!channel) continue;

      const msg = await channel.messages.fetch(msgId).catch(() => null);
      if (!msg) continue;

      await msg.delete().catch(() => {});
    }

    await supabase
      .from("message_maps")
      .delete()
      .eq("id", record.id);

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
