import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

console.log("🚨 UNI CHAT SYSTEM STARTING 🚨");

client.once("ready", () => {
  console.log(`🚀 UniChat is ONLINE: ${client.user.tag}`);
});

// ================= LANGUAGE GUESS =================
function guessLanguage(text) {
  if (/[àèìòù]/i.test(text)) return "IT";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[ñ¿¡]/i.test(text)) return "ES";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  return "EN";
}

const processed = new Set();

// ================= MESSAGE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (!message.guild) return;

  const content = message.content.trim();
  if (!content) return;

  // ================= COMMANDS =================
  if (content === "!setup") return setupCommand(message);
  if (content === "!uninstall") return uninstallCommand(message);

  // 🚫 BLOCK COMMANDS FROM TRANSLATION
  if (content.startsWith("!")) return;

  // ================= LOOP PROTECTION =================
  const key = `${message.id}`;
  if (processed.has(key)) return;
  processed.add(key);

  // ================= LOAD SETTINGS =================
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

  const sourceLang = channelMap[message.channel.id] || guessLanguage(content);

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
    KO: "Korean"
  };

  const roleName = roleMap[sourceLang];

  if (roleName) {
    try {
      const role = message.guild.roles.cache.find(r => r.name === roleName);
      const member = await message.guild.members.fetch(message.author.id);

      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }
    } catch {}
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
    console.log("❌ ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "select_default_channel") return;

  const channelId = interaction.values[0];

  await supabase.from("guild_settings").upsert({
    guild_id: interaction.guild.id,
    default_channel: channelId
  });

  await interaction.reply({
    content: `✅ Default channel set to <#${channelId}>`,
    ephemeral: true
  });

  setTimeout(async () => {
    try {
      await interaction.message.delete();
    } catch {}
  }, 3000);
});

client.login(process.env.DISCORD_TOKEN);
