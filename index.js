import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🌍 FLAG → LANGUAGE MAP
const languageMap = {
  "🇬🇧": "EN",
  "🇺🇸": "EN",
  "🇫🇷": "FR",
  "🇪🇸": "ES",
  "🇩🇪": "DE",
  "🇮🇹": "IT",
  "🇵🇹": "PT",
  "🇧🇷": "PT",
  "🇯🇵": "JA",
  "🇰🇷": "KO",
  "🇨🇳": "ZH",
  "🇷🇺": "RU",
  "🇸🇦": "AR"
};

// ⏱️ COOLDOWN (anti spam)
const cooldown = new Map();

// 🌐 DeepL translate function (with debug safety)
async function translate(text, targetLang) {
  try {
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        auth_key: process.env.DEEPL_API_KEY,
        text,
        target_lang: targetLang
      })
    });

    const data = await res.json();

    if (!data.translations || !data.translations[0]) {
      console.log("DEEPL ERROR RESPONSE:", data);
      return "Translation failed";
    }

    return data.translations[0].text;
  } catch (err) {
    console.error("DeepL request failed:", err);
    return "Translation error";
  }
}

// 🤖 MESSAGE HANDLER
client.on('messageCreate', async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const content = message.content?.trim();
  if (!content) return;

  // 🔍 detect flag
  const flag = content[0];
  const lang = languageMap[flag];

  if (!lang) return;

  // ⛔ cooldown per user
  const now = Date.now();
  const last = cooldown.get(message.author.id) || 0;

  if (now - last < 3000) return;
  cooldown.set(message.author.id, now);

  // ✂️ remove flag + space
  const text = content.slice(2).trim();
  if (!text) return;

  try {
    const translated = await translate(text, lang);
    message.reply(`🌍 ${translated}`);
  } catch (err) {
    console.error("Handler error:", err);
  }
});

// 🚀 BOT READY
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// 🔐 LOGIN (Railway variable must be DISCORD_TOKEN)
client.login(process.env.DISCORD_TOKEN);
