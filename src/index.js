import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";

console.log("🚨 ACTIVE BUILD WITH DEEPL 🚨", Date.now());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log(`BOT ONLINE: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  console.log("MESSAGE:", message.content);

  try {
    const targetLang = "EN";

    const res = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      new URLSearchParams({
        text: message.content,
        target_lang: targetLang
      }),
      {
        headers: {
          "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const translated = res.data.translations[0].text;

    await message.channel.send(`🌍 ${translated}`);

    console.log("TRANSLATION SENT");
  } catch (err) {
    console.error("DEEPL ERROR:", err?.response?.data || err.message);

    await message.channel.send("⚠️ Translation failed");
  }
});

client.login(process.env.DISCORD_TOKEN);
