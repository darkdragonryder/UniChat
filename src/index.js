import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import { getGuildSettings, getUserSettings } from "./services/supabase.js";

const log = (m) => process.stdout.write(m + "\n");

log("🚨 TRANSLATOR BOT ONLINE 🚨 " + Date.now());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  log(`✅ BOT READY: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  log("📩 " + message.content);

  try {
    // 🏢 GET SERVER SETTINGS (auto creates if missing)
    const guild = await getGuildSettings(message.guild.id);

    if (!guild.auto_translate) return;

    // 🚫 CHANNEL FILTER
    const allowed = guild.enabled_channels || [];
    if (allowed.length && !allowed.includes(message.channel.id)) return;

    // 👤 GET USER SETTINGS (auto creates if missing)
    const user = await getUserSettings(message.author.id);

    const targetLang = user.language || guild.default_language || "EN";

    // 🌍 TRANSLATE
    const res = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      new URLSearchParams({
        text: message.content,
        target_lang: targetLang
      }),
      {
        headers: {
          Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const translated = res.data.translations[0].text;

    await message.channel.send(`🌍 (${targetLang}) ${translated}`);

    log("✅ SENT");
  } catch (err) {
    log("❌ ERROR: " + JSON.stringify(err?.response?.data || err.message));
  }
});

client.login(process.env.DISCORD_TOKEN);
