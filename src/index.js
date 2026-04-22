import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
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

console.log("🚨 UNI CHAT SYSTEM STARTING 🚨");

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 UniChat BOT ONLINE: ${client.user.tag}`);
});

// ================= LANGUAGE DETECTION =================
function guessLanguage(text) {
  if (/[àèìòù]/i.test(text)) return "IT";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[ñ¿¡]/i.test(text)) return "ES";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  if (/[а-яА-ЯЁё]/.test(text)) return "RU";
  return "EN";
}

const processed = new Set();

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();
  if (!content) return;

  if (content.startsWith("/")) return;

  const key = message.id;
  if (processed.has(key)) return;
  processed.add(key);

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
      acc[id] = lang.toUpperCase();
      return acc;
    }, {})
  };

  const sourceLang =
    channelMap[message.channel.id] || guessLanguage(content);

  // ================= SAVE USER =================
  await supabase.from("user_settings").upsert({
    user_id: message.author.id,
    language: sourceLang
  });

  // ================= ROLE ASSIGN =================
  const roleMap = {
    ES: "Spanish",
    DE: "German",
    IT: "Italian",
    KO: "Korean",
    RU: "Russian"
  };

  const roleName = roleMap[sourceLang];

  if (roleName) {
    try {
      const role = message.guild.roles.cache.find(r => r.name === roleName);
      const member = await message.guild.members.fetch(message.author.id);

      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }
    } catch (err) {
      console.log("ROLE ERROR:", err.message);
    }
  }

  // ================= TRANSLATION =================
  try {
    for (const [channelId, targetLang] of Object.entries(channelMap)) {
      if (channelId === message.channel.id) continue;
      if (targetLang === sourceLang) continue;

      const translated = await translateCached(content, targetLang);

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      await channel.send(`🌍 ${translated}`);
    }
  } catch (err) {
    console.log("TRANSLATION ERROR:", err.message);
  }
});

// ================= SLASH COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setup") {
    return setupCommand(interaction);
  }

  if (interaction.commandName === "uninstall") {
    return uninstallCommand(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);
