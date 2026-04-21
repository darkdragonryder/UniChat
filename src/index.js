// src/index.js
import "dotenv/config";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import messageCreate from "./events/messageCreate.js";
import messageReactionAdd from "./events/messageReactionAdd.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", messageCreate(client));
client.on("messageReactionAdd", messageReactionAdd(client));

client.login(process.env.DISCORD_TOKEN);
