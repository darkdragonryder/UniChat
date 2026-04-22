import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import setupCommand from "./commands/setup.js";
import desetupCommand from "./commands/desetup.js";
import { translateText } from "./services/deepl.js";
import { supabase } from "./services/supabase.js";

const log = (m) => process.stdout.write(m + "\n");

log("🚨 UNI CHAT BOT STARTING 🚨 " + Date.now());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== READY =====
client.once("ready", () => {
  log(`✅ BOT ONLINE: ${client.user.tag}`);
});

// ===== MESSAGE HANDLER =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();

  // ===== COMMANDS =====
  if (content === "!setup") return setupCommand(message, supabase);
  if (content === "!desetup") return desetupCommand(message, supabase);

  // ===== LOAD GUILD SETTINGS =====
  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData) return;

  const defaultChannelId = guildData.default_channel;
  const channels = guildData.enabled_channels || {};

  const isDefault = message.channel.id === defaultChannelId;

  const langEntry = Object.entries(channels)
    .find(([lang, id]) => id === message.channel.id);

  try {
    // =========================
    // CASE 1: FROM DEFAULT (ENGLISH HUB)
    // =========================
    if (isDefault) {
      for (const [lang, channelId] of Object.entries(channels)) {
        const translated = await translateText(message.content, lang.toUpperCase());

        const channel = message.guild.channels.cache.get(channelId);
        if (channel) {
          channel.send(`🌍 ${translated}`);
        }
      }
      return;
    }

    // =========================
    // CASE 2: FROM LANGUAGE CHANNEL
    // =========================
    if (langEntry) {
      const lang = langEntry[0];

      const translated = await translateText(message.content, "EN");

      const englishChannel = message.guild.channels.cache.get(defaultChannelId);
      if (englishChannel) {
        englishChannel.send(`🌍 [${lang.toUpperCase()}] ${translated}`);
      }
    }

  } catch (err) {
    log("❌ ERROR: " + err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
