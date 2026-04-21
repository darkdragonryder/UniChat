import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🌍 LANGUAGE MAP
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

// 🌐 TRANSLATE FUNCTION (DeepL)
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

  if (!data.translations?.length) {
    console.log("DeepL error:", data);
    return "Translation failed";
  }

  return data.translations[0].text;
}

// 🤖 MESSAGE HANDLER (FLAG AT END)
client.on('messageCreate', async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const content = message.content.trim();

  // 🔍 get last emoji in message
  const flagRegex = /([\u{1F1E6}-\u{1F1FF}]{2})/gu;
  const matches = [...content.matchAll(flagRegex)];

  if (!matches.length) return;

  const flag = matches[matches.length - 1][0];
  const lang = languageMap[flag];

  if (!lang) return;

  // ✂️ remove flag from message
  const text = content.replace(flag, '').trim();

  if (!text) return;

  try {
    const translated = await translate(text, lang);
    message.reply(`🌍 ${translated}`);
  } catch (err) {
    console.error("Error:", err);
  }
});

// 🚀 READY
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// 🔐 LOGIN
client.login(process.env.DISCORD_TOKEN);
