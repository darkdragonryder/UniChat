import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

// PROOF THIS IS THE ACTIVE BUILD
console.log("🚨 ACTIVE BUILD LOADED 🚨", Date.now());

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

  console.log("NEW BUILD MESSAGE:", message.content);

  try {
    // Send current time to prove this exact code is running
    const time = new Date().toLocaleTimeString();

    await message.channel.send(`🧪 ACTIVE BUILD TIME: ${time}`);

    console.log("SEND SUCCESS");
  } catch (err) {
    console.error("SEND FAILED:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
