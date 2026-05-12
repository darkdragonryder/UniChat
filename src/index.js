import "dotenv/config";

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials
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
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember
  ]
});

// ================= READY =================
client.once("ready", async () => {
  console.log(`🚀 UniChat ONLINE: ${client.user.tag}`);
  console.log(`📊 Guilds: ${client.guilds.cache.size}`);

  for (const guild of client.guilds.cache.values()) {
    try {
      await systemHealth({ guild });
    } catch (err) {
      console.log(`⚠️ Health check failed: ${guild.name}`, err.message);
    }
  }
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

/* =========================================================
   MESSAGE CREATE (FULL FIXED FOR FORWARDS + WEBHOOKS)
========================================================= */
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild) return;

    // ================= SAFETY FILTER (FIXED) =================
    if (message.author?.id === client.user.id) return;

    const isTrueInternalBot =
      message.author?.bot &&
      !message.webhookId &&
      message.author?.id !== client.user.id;

    if (isTrueInternalBot) return;

    // ================= CONTENT EXTRACTION (ROBUST) =================
    const content =
      message.content?.trim() ||
      message.embeds?.[0]?.description ||
      message.embeds?.[0]?.title ||
      message.embeds?.map(e => e.description || e.title || "").join(" ") ||
      "";

    if (!content.trim()) return;

    const supabase = db();

    const { data, error } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (error || !data?.enabled_channels) return;

    const channels = data.enabled_channels;

    // ================= SOURCE LANGUAGE DETECTION =================
    let sourceLang = null;

    // 1. message map lookup (best accuracy)
    const { data: maps } = await supabase
      .from("message_maps")
      .select("channel_map")
      .eq("guild_id", message.guild.id);

    if (maps?.length) {
      for (const map of maps) {
        for (const [lang, msgId] of Object.entries(map.channel_map || {})) {
          if (msgId === message.id) {
            sourceLang = lang;
            break;
          }
        }
        if (sourceLang) break;
      }
    }

    // 2. channel mapping fallback
    if (!sourceLang) {
      for (const [lang, id] of Object.entries(channels)) {
        if (String(id) === String(message.channel.id)) {
          sourceLang = lang;
          break;
        }
      }
    }

    // 3. final fallback (required for forwarded content)
    if (!sourceLang) {
      sourceLang = "EN";
    }

    const messageMap = { [sourceLang]: message.id };

    // ================= TRANSLATION LOOP =================
    for (const [lang, channelId] of Object.entries(channels)) {
      if (lang === sourceLang) continue;

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, lang);
      if (!translated) continue;

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setAuthor({
          name:
            message.member?.displayName ||
            message.author?.username ||
            "Forwarded Message",
          iconURL: message.author?.displayAvatarURL?.() || null
        })
        .setDescription(translated)
        .setFooter({ text: `🌍 ${sourceLang} → ${lang}` })
        .setTimestamp();

      const sent = await channel.send({ embeds: [embed] }).catch(() => null);

      if (sent) messageMap[lang] = sent.id;
    }

    // ================= SAVE MAP =================
    await supabase.from("message_maps").upsert(
      {
        guild_id: message.guild.id,
        base_message_id: message.id,
        channel_map: messageMap
      },
      {
        onConflict: "guild_id,base_message_id"
      }
    );

  } catch (err) {
    console.log("MESSAGE CREATE ERROR:", err);
  }
});

/* =========================================================
   MESSAGE UPDATE
========================================================= */
client.on("messageUpdate", async (_, newMsg) => {
  try {
    if (!newMsg.guild || newMsg.author?.bot) return;

    const content =
      newMsg.content?.trim() ||
      newMsg.embeds?.[0]?.description ||
      newMsg.embeds?.[0]?.title ||
      "";

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

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", newMsg.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;
    if (!channels) return;

    let sourceLang = null;

    for (const [lang, msgId] of Object.entries(record.channel_map)) {
      if (msgId === newMsg.id) sourceLang = lang;
    }

    for (const [lang, msgId] of Object.entries(record.channel_map)) {
      if (msgId === newMsg.id) continue;

      const channel = newMsg.guild.channels.cache.get(channels[lang]);
      if (!channel) continue;

      const msg = await channel.messages.fetch(msgId).catch(() => null);
      if (!msg) continue;

      const translated = await translateCached(content, lang);
      if (!translated) continue;

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setDescription(translated)
        .setFooter({ text: `🌍 ${sourceLang || "?"} → ${lang} (edited)` });

      await msg.edit({ embeds: [embed] }).catch(() => {});
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
    if (!message.guild?.id || !message.id) return;

    const supabase = db();

    const { data: maps } = await supabase
      .from("message_maps")
      .select("*")
      .eq("guild_id", message.guild.id);

    const record = maps?.find(m =>
      Object.values(m.channel_map || {}).includes(message.id)
    );

    if (!record) return;

    await supabase
      .from("message_maps")
      .delete()
      .eq("id", record.id);

  } catch (err) {
    console.log("DELETE ERROR:", err);
  }
});

/* =========================================================
   COMMAND HANDLER
========================================================= */
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const handlers = {
      setup: setupCommand,
      uninstall: uninstallCommand,
      setlanguage: setLanguageCommand,
      help: helpCommand,
      info: infoCommand,
      migrate: migrateCommand,
      addlanguage: addLanguageCommand,
      repair: repairCommand,
      unlock: unlockCommand,
      "announce-owner": announceOwnerCommand,
      diagnose: diagnoseCommand
    };

    const cmd = handlers[interaction.commandName];
    if (cmd) return cmd(interaction, client);

  } catch (err) {
    console.log("INTERACTION ERROR:", err);

    const reply = { content: "❌ Error occurred", ephemeral: true };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

/* =========================================================
   ERRORS
========================================================= */
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

/* =========================================================
   LOGIN
========================================================= */
client.login(process.env.DISCORD_TOKEN);
