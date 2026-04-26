import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

// ================= CONFIG =================
const CHANNEL_ID = process.env.TEST_CHANNEL_ID;

// messages to simulate real users
const messages = [
  "Hello everyone 👋",
  "How are you?",
  "This is a stress test",
  "Testing global chat system",
  "Does translation work?",
  "Bonjour tout le monde",
  "Hola amigos",
  "こんにちは",
  "Just checking latency",
  "Final test message"
];

// ================= CREATE BOT CLIENT =================
function createBot(token, name) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", async () => {
    console.log(`✅ ${name} ONLINE as ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    let i = 0;

    const interval = setInterval(async () => {
      if (i >= messages.length) {
        clearInterval(interval);
        console.log(`🏁 ${name} finished test`);
        return;
      }

      try {
        await channel.send(messages[i]);
        console.log(`${name} sent: ${messages[i]}`);
      } catch (err) {
        console.log(`${name} error:`, err.message);
      }

      i++;
    }, 3000); // 3 sec spacing = SAFE LOAD
  });

  client.login(token);
}

// ================= START TEST BOTS =================
createBot(process.env.TEST_BOT_1, "TestBot1");
createBot(process.env.TEST_BOT_2, "TestBot2");
createBot(process.env.TEST_BOT_3, "TestBot3");
