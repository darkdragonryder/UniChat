import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

// Commands
import setupCommand from "./commands/setup.js";
import desetupCommand from "./commands/desetup.js";

// Services
import { supabase } from "./services/supabase.js";

// ===== LOGGER (Railway safe) =====
const log = (msg) => process.stdout.write(msg + "\n");

log("🚨 UNI CHAT BOT STARTING 🚨 " + Date.now());

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== READY =====
client.once("ready", () => {
  log(`✅ BOT ONLINE: ${client.user.tag}`);
});

// ===== MESSAGE HANDLER =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  log("📩 MESSAGE: " + message.content);

  try {
    const content = message.content.toLowerCase();

    // ===== SETUP =====
    if (content === "!setup") {
      return setupCommand(message, supabase);
    }

    // ===== DESETUP =====
    if (content === "!desetup") {
      return desetupCommand(message, supabase);
    }

    // (Phase 1 ends here — no translation yet)

  } catch (err) {
    log("❌ ERROR: " + (err?.message || err));
  }
});

// ===== KEEP ALIVE (Railway stability) =====
setInterval(() => {
  process.stdout.write("💓 alive\n");
}, 30000);

// Safety loop (prevents idle shutdown edge cases)
setInterval(() => {}, 1 << 30);

// ===== LOGIN =====
client.login(process.env.DISCORD_TOKEN);
