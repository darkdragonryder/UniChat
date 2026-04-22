import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import setupCommand from "./commands/setup.js";
import { supabase } from "./services/supabase.js";
import { translateText } from "./services/deepl.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

console.log("🚨 PHASE 4 TRANSLATION SYSTEM STARTING 🚨");

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀UniChat ONLINE: ${client.user.tag}`);
});

// ================= LANGUAGE DETECTION (simple fallback) =================
function guessLanguage(text) {
  if (/[àèìòù]/i.test(text)) return "IT";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[ñ¿¡]/i.test(text)) return "ES";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  return "EN";
}

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (!message.guild) return;

  const content = message.content.trim();
  if (!content) return;

  if (content === "!setup") return setupCommand(message);

  // ================= LOAD DATA =================
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

  // ================= SAVE USER LANGUAGE =================
  await supabase.from("user_settings").upsert({
    user_id: message.author.id,
    language: sourceLang
  });

  const allChannelIds = Object.keys(channelMap);

  try {
    for (const targetChannelId of allChannelIds) {
      if (targetChannelId === message.channel.id) continue;

      const targetLang = channelMap[targetChannelId];
      if (!targetLang || targetLang === sourceLang) continue;

      const translated = await translateText(
        content,
        targetLang === "EN" ? "EN" : targetLang
      );

      const channel = message.guild.channels.cache.get(targetChannelId);
      if (!channel) continue;

      await channel.send(`🌍 ${translated}`);
    }

  } catch (err) {
    console.log("❌ PHASE 4 ERROR:", err.message);
  }
});
