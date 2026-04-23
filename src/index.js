import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { execSync } from "child_process";

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import dashboardCommand from "./commands/dashboard.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

console.log("🚀 UniChat BOT STARTING");

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 UniChat BOT ONLINE: ${client.user.tag}`);

  if (process.env.AUTO_DEPLOY === "true") {
    try {
      console.log("🔁 Auto deploying slash commands...");
      execSync("node ./src/deployCommands.js", { stdio: "inherit" });
    } catch (err) {
      console.log("⚠️ Auto deploy failed:", err.message);
    }
  }
});

// ================= LANGUAGE DETECTION =================
function guessLanguage(text) {
  if (/[а-яё]/i.test(text)) return "RU";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  if (/[ñ¿¡]/.test(text)) return "ES";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[àèìòù]/i.test(text)) return "IT";
  return "EN";
}

const roleMap = {
  EN: "English",
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian"
};

const processed = new Set();

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (message.interaction) return;

  const content = message.content.trim();
  if (!content || content.startsWith("/")) return;

  if (processed.has(message.id)) return;
  processed.add(message.id);

  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData || !guildData.enabled_channels) return;

  const enabled = guildData.enabled_channels;
  const defaultChannel = guildData.default_channel;

  const channelMap = {};

  if (defaultChannel) {
    channelMap[defaultChannel] = "EN";
  }

  for (const [lang, id] of Object.entries(enabled)) {
    channelMap[id] = lang.toUpperCase();
  }

  const sourceLang =
    channelMap[message.channel.id] || guessLanguage(content);

  const member = await message.guild.members.fetch(message.author.id);

  // ================= ROLE SYNC =================
  const roleName = roleMap[sourceLang];

  if (roleName) {
    const role = message.guild.roles.cache.find(r => r.name === roleName);

    if (role) {
      const allRoles = Object.values(roleMap);

      for (const r of member.roles.cache.values()) {
        if (allRoles.includes(r.name)) {
          await member.roles.remove(r).catch(() => {});
        }
      }

      await member.roles.add(role).catch(() => {});
    }
  }

  // ================= TRANSLATION =================
  for (const [channelId, targetLang] of Object.entries(channelMap)) {
    if (channelId === message.channel.id) continue;
    if (targetLang === sourceLang) continue;

    const translated = await translateCached(content, targetLang);
    const channel = message.guild.channels.cache.get(channelId);

    if (channel) {
      await channel.send(`🌍 ${translated}`);
    }
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "setup") return setupCommand(interaction);
    if (interaction.commandName === "uninstall") return uninstallCommand(interaction);
    if (interaction.commandName === "setlanguage") return setLanguageCommand(interaction);
    if (interaction.commandName === "dashboard") return dashboardCommand(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === "dash_setup") {
      const m = await import("./commands/setup.js");
      return m.default(interaction);
    }

    if (interaction.customId === "dash_uninstall") {
      const m = await import("./commands/uninstall.js");
      return m.default(interaction);
    }

    if (interaction.customId === "dash_sync") {
      return interaction.reply({
        content: "🔄 Syncing roles...",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
