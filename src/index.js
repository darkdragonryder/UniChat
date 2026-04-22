import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";

// Stable logging for Railway
const log = (m) => process.stdout.write(m + "\n");

log("🚨 ACTIVE BUILD WITH DEEPL 🚨 " + Date.now());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  log(`✅ BOT ONLINE: ${client.user.tag}`);
});

// MESSAGE HANDLER
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  log("📩 MESSAGE: " + message.content);

  try {
    const res = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      new URLSearchParams({
        text: message.content,
        target_lang: "EN"
      }),
      {
        headers: {
          Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const translated = res.data.translations[0].text;

    await message.channel.send(`🌍 ${translated}`);

    log("✅ TRANSLATION SENT");
  } catch (err) {
    log("❌ DEEPL ERROR: " + JSON.stringify(err?.response?.data || err.message));

    await message.channel.send("⚠️ Translation failed");
  }
});

// KEEP PROCESS ALIVE (Railway stability fix)
setInterval(() => {
  process.stdout.write("💓 alive\n");
}, 30000);

client.login(process.env.DISCORD_TOKEN);
