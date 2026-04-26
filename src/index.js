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

// ================= BUILD SAFE ROUTING MAP =================
async function buildChannelMap(guild, settings) {
  const map = new Map();

  // Always resolve fresh channels (no cache trust)
  const channels = await guild.channels.fetch();

  // Validate default channel (EN source)
  if (settings.default_channel && channels.get(settings.default_channel)) {
    map.set(settings.default_channel, "EN");
  }

  // Validate language channels strictly from DB
  for (const [lang, id] of Object.entries(settings.enabled_channels || {})) {
    const ch = channels.get(id);
    if (!ch) continue; // ignore deleted/orphan channels

    map.set(id, lang.toUpperCase());
  }

  return map;
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

    // ===== SETTINGS (SOURCE OF TRUTH) =====
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!settings?.enabled_channels) return;

    // 🔒 STRICT MAP (NO CACHE RELIANCE)
    const channelMap = await buildChannelMap(message.guild, settings);

    if (!channelMap.size) return;

    const currentLang = channelMap.get(message.channel.id);
    if (!currentLang) return; // ignore unmanaged channels

    const onlyEmoji = isOnlyEmoji(content);

    // ================= ROUTING =================
    for (const [channelId, targetLang] of channelMap.entries()) {
      if (channelId === message.channel.id) continue;
      if (targetLang === currentLang) continue;

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      // 🟢 EMOJIS: PASS THROUGH
      if (onlyEmoji) {
        await sendAsUser(channel, message.author, content);
        continue;
      }

      // 🟡 TEXT: TRANSLATE
      const translated = await translateCached(content, targetLang);
      if (!translated) continue;

      await sendAsUser(channel, message.author, `🌍 ${translated}`);
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
