import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
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

console.log("🚀 UniChat STARTING");

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 ONLINE: ${client.user.tag}`);
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

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  if (!content || content.startsWith("/")) return;

  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .maybeSingle();

  if (!guildData) return;

  const enabled = guildData.enabled_channels ?? {};
  const defaultChannel = guildData.default_channel;

  // ================= CHANNEL MAP =================
  const channelMap = new Map();

  if (defaultChannel) {
    channelMap.set(defaultChannel, "EN");
  }

  for (const [lang, id] of Object.entries(enabled)) {
    channelMap.set(id, lang.toUpperCase());
  }

  console.log("MAP:", [...channelMap.entries()]);

  const sourceLang =
    channelMap.get(message.channel.id) || guessLanguage(content);

  console.log("SOURCE:", sourceLang);

  // ================= ROLE ASSIGN =================
  const member = await message.guild.members.fetch(message.author.id);
  const roleName = roleMap[sourceLang];

  if (roleName) {
    const role = message.guild.roles.cache.find(r => r.name === roleName);

    if (role) {
      for (const r of member.roles.cache.values()) {
        if (Object.values(roleMap).includes(r.name)) {
          await member.roles.remove(r).catch(() => {});
        }
      }

      await member.roles.add(role).catch(() => {});
    }
  }

  // ================= TRANSLATION =================
  for (const [channelId, targetLang] of channelMap.entries()) {

    if (channelId === message.channel.id) continue;
    if (!targetLang) continue;
    if (targetLang === sourceLang) continue;

    const channel = await message.guild.channels.fetch(channelId).catch(() => null);
    if (!channel) continue;

    const translated = await translateCached(content, targetLang);

    if (!translated) continue;

    await channel.send(`🌍 ${translated}`).catch(err => {
      console.log("SEND FAIL:", err.message);
    });
  }
});

// ================= COMMANDS =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setup") {
    return setupCommand(interaction);
  }

  if (interaction.commandName === "uninstall") {
    return uninstallCommand(interaction);
  }

  if (interaction.commandName === "setlanguage") {
    return setLanguageCommand(interaction);
  }

  if (interaction.commandName === "dashboard") {
    return dashboardCommand(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);
