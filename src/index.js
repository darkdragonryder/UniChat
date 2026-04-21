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
  console.log(`BOT ONLINE: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  console.log("MESSAGE:", message.content);

  try {
    // STEP 1: SAFE BASE RESPONSE (NO API, NO DATABASE YET)
    const response = `🌍 Echo: ${message.content}`;

    await message.channel.send({
      content: response
    });

    console.log("MESSAGE SENT OK");
  } catch (err) {
    console.error("SEND ERROR:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
