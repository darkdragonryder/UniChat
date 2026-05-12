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
   MESSAGE CREATE (CLEAN WORKING VERSION)
========================================================= */
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author?.bot) return;

    const content = message.content?.trim();
    if (!content) return;

    const supabase = db();

    const { data, error } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (error || !data?.enabled_channels) return;

    const channels = data.enabled_channels;

    // ================= FIND SOURCE LANGUAGE =================
    let sourceLang = null;

    for (const [lang, channelId] of Object.entries(channels)) {
      if (String(channelId) === String(message.channel.id)) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    // ================= TRANSLATE TO ALL OTHER LANGUAGES =================
    for (const [lang, channelId] of Object.entries(channels)) {
      if (lang === sourceLang) continue;

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, lang);
      if (!translated) continue;

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setAuthor({
          name: message.member?.displayName || message.author.username,
          iconURL: message.author.displayAvatarURL()
        })
        .setDescription(translated)
        .setFooter({ text: `🌍 ${sourceLang} → ${lang}` })
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE CREATE ERROR:", err);
  }
});

/* =========================================================
   INTERACTIONS
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

    console.log("UNKNOWN COMMAND:", interaction.commandName);

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);

    const reply = { content: "❌ Error occurred", ephemeral: true };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

/* =========================================================
   GLOBAL ERROR HANDLING
========================================================= */
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

/* =========================================================
   LOGIN
========================================================= */
client.login(process.env.DISCORD_TOKEN);
