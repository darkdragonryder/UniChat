import "dotenv/config";

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from "discord.js";

import { db } from "./services/supabase.js";
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
  console.log(`🚀 UniChat v4.2 ONLINE: ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);

  for (const guild of client.guilds.cache.values()) {
    try {
      await systemHealth({ guild });
    } catch (err) {
      console.log(`⚠️ Health check failed for ${guild.name}:`, err.message);
    }
  }
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

/* =========================================================
   MESSAGE CREATE
========================================================= */
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    // FIX: Support forwarded/embed messages
    const content =
      message.content?.trim() ||
      message.embeds?.[0]?.description ||
      message.embeds?.[0]?.title;

    if (!content) return;

    const supabase = db();

    const { data, error } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (error || !data?.enabled_channels) {
      console.log("GUILD SETTINGS ERROR:", error?.message);
      return;
    }

    const channels = data.enabled_channels;

    let sourceLang = null;

    for (const [lang, id] of Object.entries(channels)) {
      if (String(message.channel.id) === String(id)) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) {
      console.log("SOURCE LANG NOT FOUND");
      return;
    }

    const messageMap = {
      [sourceLang]: message.id
    };

    for (const [lang, channelId] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      const channel = await message.guild.channels
        .fetch(channelId)
        .catch(() => null);

      if (!channel) {
        console.log(`CHANNEL NOT FOUND: ${lang}`);
        continue;
      }

      const translated = await translateCached(content, lang);

      if (!translated) {
        console.log(`TRANSLATION FAILED: ${lang}`);
        continue;
      }

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setAuthor({
          name: message.member?.displayName || message.author.username,
          iconURL: message.author.displayAvatarURL()
        })
        .setDescription(translated)
        .setFooter({
          text: `🌍 ${sourceLang} → ${lang}`
        })
        .setTimestamp();

      const sent = await channel.send({
        embeds: [embed]
      }).catch((err) => {
        console.log(`SEND ERROR [${lang}]:`, err.message);
        return null;
      });

      if (sent) {
        messageMap[lang] = sent.id;
      }
    }

    const { error: insertErr } = await supabase
      .from("message_maps")
      .upsert({
        guild_id: message.guild.id,
        base_message_id: message.id,
        channel_map: messageMap
      }, {
        onConflict: "guild_id,base_message_id"
      });

    if (insertErr) {
      console.log("MESSAGE MAP INSERT ERROR:", insertErr.message);
    }

  } catch (err) {
    console.log("MESSAGE CREATE ERROR:", err);
  }
});

/* =========================================================
   MESSAGE UPDATE
========================================================= */
client.on("messageUpdate", async (oldMsg, newMsg) => {
  try {

    if (!newMsg.guild || newMsg.author?.bot) return;

    const content =
      newMsg.content?.trim() ||
      newMsg.embeds?.[0]?.description ||
      newMsg.embeds?.[0]?.title;

    if (!content) return;

    const supabase = db();

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

    let sourceLang = null;

    for (const [lang, msgId] of Object.entries(map)) {
      if (msgId === newMsg.id) {
        sourceLang = lang;
        break;
      }
    }

    for (const [lang, msgId] of Object.entries(map)) {

      if (msgId === newMsg.id) continue;

      const channelId = channels[lang];

      if (!channelId) continue;

      const channel = await newMsg.guild.channels
        .fetch(channelId)
        .catch(() => null);

      if (!channel) continue;

      const msg = await channel.messages
        .fetch(msgId)
        .catch(() => null);

      if (!msg) continue;

      const translated = await translateCached(content, lang);

      if (!translated) continue;

      const originalEmbed = msg.embeds[0];

      const newEmbed = originalEmbed
        ? EmbedBuilder.from(originalEmbed)
            .setDescription(translated)
            .setFooter({
              text: `🌍 ${sourceLang || "?"} → ${lang} (edited)`
            })
        : new EmbedBuilder()
            .setColor(0x00bfff)
            .setDescription(translated)
            .setFooter({
              text: `🌍 ${sourceLang || "?"} → ${lang} (edited)`
            });

      await msg.edit({
        embeds: [newEmbed]
      }).catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE UPDATE ERROR:", err);
  }
});

/* =========================================================
   MESSAGE DELETE
========================================================= */
client.on("messageDelete", async (message) => {
  try {

    if (!message.guild || !message.id) return;

    const supabase = db();

    const { data: maps } = await supabase
      .from("message_maps")
      .select("*")
      .eq("guild_id", message.guild.id);

    const record = maps?.find(m =>
      Object.values(m.channel_map || {}).includes(message.id)
    );

    if (!record) return;

    const map = record.channel_map;

    await supabase
      .from("message_maps")
      .delete()
      .eq("id", record.id);

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

      const channel = await message.guild.channels
        .fetch(channelId)
        .catch(() => null);

      if (!channel) continue;

      const msg = await channel.messages
        .fetch(msgId)
        .catch(() => null);

      if (!msg) continue;

      await msg.delete().catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE DELETE ERROR:", err);
  }
});

/* =========================================================
   COMMANDS
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

      default:
        console.log(`UNKNOWN COMMAND: ${interaction.commandName}`);
    }

  } catch (err) {

    console.log("INTERACTION ERROR:", err);

    try {

      if (interaction.replied || interaction.deferred) {

        await interaction.editReply({
          content: "❌ An error occurred"
        });

      } else {

        await interaction.reply({
          content: "❌ An error occurred",
          ephemeral: true
        });
      }

    } catch {}
  }
});

/* =========================================================
   GLOBAL ERROR HANDLERS
========================================================= */

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

/* =========================================================
   LOGIN
========================================================= */

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("❌ FAILED TO LOGIN:", err.message);
  process.exit(1);
});
