import "dotenv/config";
import fs from "fs";

console.log("FILES IN SRC:", fs.readdirSync("./src/events"));

import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log("BOT ONLINE");
});

client.on("messageCreate", (m) => {
  console.log("MESSAGE:", m.content);
});

client.login(process.env.DISCORD_TOKEN);
