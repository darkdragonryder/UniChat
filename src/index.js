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

// ================= HELPERS =================
function isOnlyEmoji(text) {
  if (!text) return false;
  return /^[\p{Extended_Pictographic}\p{Emoji}\s]+$/u.test(text.trim());
}

function containsEmoji(text) {
  if (!text) return false;
  return /[\p{Extended_Pictographic}]/u.test(text);
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
async function sendAsUser(channel, user, content) {
  const webhooks = await channel.fetchWebhooks();

  let webhook = webhooks.find(w => w.owner?.id === client.user.id);

  if (!webhook) {
    webhook = await channel.createWebhook({
      name: "UniChat Relay"
    });
  }

  await webhook.send({
    content,
    username: user.username,
    avatarURL: user.displayAvatarURL(),
    allowedMentions: { parse: [] }
  });
}

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const content = message.content?.trim();
    if (shouldIgnore(content)) return;

    // ===== USER =====
    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user?.language) return;

    // ===== GUILD =====
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

    // ================= EMOJI LOGIC =================
    const onlyEmoji = isOnlyEmoji(content);

    for (const [channelId, targetLang] of channelMap.entries()) {
      if (channelId === message.channel.id) continue;
      if (targetLang === currentLang) continue;

      const channel = channels.get(channelId);
      if (!channel) continue;

      // 🟢 PURE EMOJIS → NO TRANSLATION
      if (onlyEmoji) {
        await sendAsUser(channel, message.author, content);
        continue;
      }

      // 🟡 MIXED OR TEXT → TRANSLATE TEXT ONLY
      let finalText = content;

      if (!onlyEmoji) {
        finalText = await translateCached(content, targetLang);
      }

      if (!finalText) continue;

      await sendAsUser(channel, message.author, `🌍 ${finalText}`);
    }

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
