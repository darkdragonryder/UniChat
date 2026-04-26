import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);
});

// ================= SAFETY CONSTANT =================
const BOT_ID = null; // will be set after login

// ================= BUFFER =================
const buffer = new Map();

// ================= HELPERS =================
function shouldIgnore(text) {
  if (!text) return true;

  const t = text.trim();
  if (t.length <= 1) return true;
  if (t.startsWith("/")) return true;

  const junk = ["ok", "okay", "lol", "lmao", "brb", "gg"];
  if (junk.includes(t.toLowerCase())) return true;

  if (t.startsWith("http")) return true;

  return false;
}

function isOnlyEmoji(text) {
  if (!text) return false;
  return /^[\p{Extended_Pictographic}\p{Emoji}\s]+$/u.test(text.trim());
}

// ================= WEBHOOK SENDER =================
async function sendAsUser(channel, user, content) {
  const webhooks = await channel.fetchWebhooks();

  let webhook = webhooks.find(w => w.owner?.id === client.user.id);

  if (!webhook) {
    webhook = await channel.createWebhook({
      name: "Global Chat"
    });
  }

  await webhook.send({
    content,
    username: user.username,
    avatarURL: user.displayAvatarURL(),
    allowedMentions: { parse: [] } // 🔒 IMPORTANT SAFETY
  });
}

// ================= MESSAGE FLUSH =================
async function flushBuffer(key, data, channelMap, message, isEmoji) {
  try {
    const text = data.messages.join("\n");
    const currentLang = data.lang;

    for (const [channelId, targetLang] of channelMap.entries()) {
      if (channelId === message.channel.id) continue;
      if (targetLang === currentLang) continue;

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      if (isEmoji) {
        await sendAsUser(channel, message.author, text);
        continue;
      }

      const translated = await translateCached(text, targetLang);
      if (!translated) continue;

      await sendAsUser(channel, message.author, translated);
    }

  } catch (err) {
    console.log("BUFFER ERROR:", err.message);
  } finally {
    buffer.delete(key);
  }
}

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  try {
    // 🔒 SAFETY BLOCK (CRITICAL)
    if (message.webhookId) return;      // prevent webhook loops
    if (message.author.bot) return;     // prevent bot echo loops
    if (!message.guild) return;

    const content = message.content?.trim();
    if (shouldIgnore(content)) return;

    // 🔒 optional extra safety (self echo protection)
    if (BOT_ID && message.author.id === BOT_ID) return;

    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user?.language) return;

    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!settings?.enabled_channels) return;

    const channels = await message.guild.channels.fetch();

    const channelMap = new Map();

    if (settings.default_channel && channels.get(settings.default_channel)) {
      channelMap.set(settings.default_channel, "EN");
    }

    for (const [lang, id] of Object.entries(settings.enabled_channels)) {
      if (channels.get(id)) {
        channelMap.set(id, lang.toUpperCase());
      }
    }

    const currentLang = channelMap.get(message.channel.id);
    if (!currentLang) return;

    const key = `${message.guild.id}::${message.channel.id}::${currentLang}`;

    const emojiOnly = isOnlyEmoji(content);

    if (!buffer.has(key)) {
      buffer.set(key, {
        messages: [],
        lang: currentLang,
        timer: setTimeout(() => {
          const data = buffer.get(key);
          if (!data) return;
          flushBuffer(key, data, channelMap, message, emojiOnly);
        }, 1800)
      });
    }

    buffer.get(key).messages.push(content);

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

// ================= COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setup") return setupCommand(interaction);
  if (interaction.commandName === "uninstall") return uninstallCommand(interaction);
  if (interaction.commandName === "setlanguage") return setLanguageCommand(interaction);
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN).then(() => {
  BOT_ID = client.user.id;
});
