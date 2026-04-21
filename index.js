import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Simple placeholder translator (we’ll upgrade later)
function translate(text, lang = 'en') {
  return `[${lang}] ${text}`;
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Simple command: !translate es hello
  if (message.content.startsWith('!translate')) {
    const args = message.content.split(' ');
    const lang = args[1];
    const text = args.slice(2).join(' ');

    if (!lang || !text) {
      return message.reply('Usage: !translate <lang> <text>');
    }

    const result = translate(text, lang);
    return message.reply(result);
  }
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
