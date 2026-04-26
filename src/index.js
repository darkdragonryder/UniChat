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

// ================= SETTINGS =================
// Toggle for “native feel mode”
const NATIVE_MODE = true;

// ================= BUFFER =================
const buffer = new Map();

// ================= HELPERS =================
function isOnlyEmoji(text) {
  if (!text) return false;
  return /^[\p{Extended_Pictographic}\p{Emoji}\s]+$/u.test(text.trim());
}

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

// ================= WEBHOOK =================
async function sendNative(channel, user, content, langTag) {
  const webhooks = await channel.fetchWebhooks();

  let webhook = webhooks.find(w => w.owner?.id === client.user.id);

  if (!webhook) {
    webhook = await channel.createWebhook({
      name: "Global Chat"
    });
  }

  await webhook.send({
    content: NATIVE_MODE ? content : `[${langTag}] ${content}`,
    username: user.username,
    avatarURL: user.displayAvatarURL(),
    allowedMentions: { parse: [] }
  });
}

// ================= FLUSH =================
async function flush(key, data, channelMap, message) {
  try {
    const text = data.messages.join("\n");

    const currentLang = data.lang;
    const emojiOnly = isOnlyEmoji(text);

    for (const [channelId, targetLang] of channelMap.entries()) {
      if (channelId === message.channel.id) continue;
      if (targetLang === currentLang) continue;

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      let finalText = text;

      if (!emojiOnly) {
        finalText = await translateCached(text, targetLang);
      }

      if (!finalText) continue;

      await sendNative(channel, message.author, finalText, targetLang);
    }

  } catch (err) {
    console.log("FLUSH ERROR:", err.message);
  } finally {
    buffer.delete(key);
  }
}

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const content = message.content?.trim();
    if (shouldIgnore(content)) return;

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

    if (!buffer.has(key)) {
      buffer.set(key, {
        messages: [],
        lang: currentLang,
        timer: setTimeout(() => {
          const data = buffer.get(key);
          if (!data) return;
          flush(key, data, channelMap, message);
        }, 1800) // slightly smoother feel
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

client.login(process.env.DISCORD_TOKEN);
