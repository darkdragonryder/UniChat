import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log("BOT ONLINE:", client.user.tag);
});

client.on("messageCreate", async (message) => {
  console.log("MESSAGE:", message.content);

  if (message.author.bot) return;

  try {
    await message.channel.send("✅ BOT IS RESPONDING");
    console.log("SEND OK");
  } catch (err) {
    console.error("SEND FAILED:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
