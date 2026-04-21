import 'dotenv/config';
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
  "🇳🇱": "NL",
  "🇵🇱": "PL",
  "🇷🇺": "RU",
  "🇯🇵": "JA",
  "🇰🇷": "KO",
  "🇨🇳": "ZH",
  "🇹🇷": "TR",
  "🇸🇪": "SV",
  "🇳🇴": "NO",
  "🇩🇰": "DA",
  "🇫🇮": "FI",
  "🇺🇦": "UK",
  "🇨🇿": "CS",
  "🇬🇷": "EL",
  "🇮🇳": "HI",
  "🇸🇦": "AR",
  "🇮🇱": "HE"
};

// 🔥 DeepL translate
async function translate(text, targetLang) {
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
  return data.translations?.[0]?.text || 'Translation failed';
}

// 🤖 MESSAGE HANDLER
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const firstChar = [...message.content][0];
  const lang = languageMap[firstChar];

  if (!lang) return;

  const text = message.content.slice(2).trim();
  if (!text) return;

  const result = await translate(text, lang);

  message.reply(`🌍 ${result}`);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
