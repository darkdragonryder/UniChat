import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";

// PROOF BUILD
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
    // 🌍 TARGET LANGUAGE (hardcoded for now)
    const targetLang = "EN";

    // 🔥 CALL DEEPL API
    const res = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      null,
      {
        params: {
          auth_key: process.env.DEEPL_API_KEY,
          text: message.content,
          target_lang: targetLang
        }
      }
    );

    const translated = res.data.translations[0].text;

    await message.channel.send(`🌍 ${translated}`);

    console.log("TRANSLATION SENT");
  } catch (err) {
    console.error("DEEPL ERROR:", err?.response?.data || err.message);

    // fallback so bot never goes silent again
    await message.channel.send("⚠️ Translation failed");
  }
});

client.login(process.env.DISCORD_TOKEN);
