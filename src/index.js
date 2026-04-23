import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { execSync } from "child_process";

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";

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
      execSync("node ./src/deployCommands.js", { stdio: "inherit" });
    } catch {
      console.log("⚠️ Auto deploy skipped");
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

// ================= ROLE MAP =================
const roleMap = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian"
};

const processed = new Set();

// ================= MESSAGE HANDLER =================
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

  if (!guildData) return;

  const channels = guildData.enabled_channels || {};
  const defaultChannel = guildData.default_channel;

  const channelMap = {
    [defaultChannel]: "EN",
    ...Object.entries(channels).reduce((acc, [lang, id]) => {
      acc[id] = lang;
      return acc;
    }, {})
  };

  const sourceLang =
    channelMap[message.channel.id] || guessLanguage(content);

  const member = await message.guild.members.fetch(message.author.id);

  // ================= ROLE ASSIGN =================
  const roleName = roleMap[sourceLang];

  if (roleName) {
    const role = message.guild.roles.cache.find(r => r.name === roleName);

    if (role) {
      const allRoles = Object.values(roleMap);

      // remove old language roles
      for (const r of member.roles.cache.values()) {
        if (allRoles.includes(r.name)) {
          await member.roles.remove(r);
        }
      }

      await member.roles.add(role);
    }

    // ================= CHANNEL SWITCH =================
    const generalId = defaultChannel;
    const targetId = channels[sourceLang];

    const general = message.guild.channels.cache.get(generalId);
    const target = message.guild.channels.cache.get(targetId);

    // NON-ENGLISH USERS
    if (sourceLang !== "EN") {
      if (general) {
        await general.permissionOverwrites.edit(member.id, {
          ViewChannel: false
        });
      }

      if (target) {
        await target.permissionOverwrites.edit(member.id, {
          ViewChannel: true
        });
      }
    }

    // ENGLISH USERS
    if (sourceLang === "EN") {
      if (general) {
        await general.permissionOverwrites.edit(member.id, {
          ViewChannel: true
        });
      }
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

// ================= COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "setup") return setupCommand(interaction);
    if (interaction.commandName === "uninstall") return uninstallCommand(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === "dismiss") {
      return interaction.message.delete().catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
