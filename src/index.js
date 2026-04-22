import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import setupCommand from "./commands/setup.js";
import { supabase } from "./services/supabase.js";

const log = (msg) => process.stdout.write(msg + "\n");

log("🚨 UNI CHAT BOT STARTING 🚨 " + Date.now());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ✅ Bot Ready
client.once("ready", () => {
  log(`✅ BOT ONLINE: ${client.user.tag}`);
});

// ✅ Message Handler
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  log("📩 MESSAGE: " + message.content);

  try {
    // ===== SETUP COMMAND =====
    if (message.content === "!setup") {
      return setupCommand(message, supabase);
    }

    // (Phase 1 ends here — no translation yet)

  } catch (err) {
    log("❌ ERROR: " + (err?.message || err));
  }
});

// KEEP ALIVE (Railway stability)
setInterval(() => {
  process.stdout.write("💓 alive\n");
}, 30000);

// Safety no-op loop
setInterval(() => {}, 1 << 30);

client.login(process.env.DISCORD_TOKEN);
