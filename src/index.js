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

// ================= SIMPLE MESSAGE FILTER =================
function shouldIgnore(content) {
  if (!content) return true;

  const t = content.trim();

  if (t.length <= 2) return true; // too short
  if (t.startsWith("/")) return true; // commands

  const junk = ["ok", "okay", "lol", "lmao", "brb", "gg"];
  if (junk.includes(t.toLowerCase())) return true;

  if (/^[^\p{L}\p{N}]+$/u.test(t)) return true; // emojis only
  if (t.startsWith("http")) return true;

  return false;
}

// ================= WEBHOOK SENDER =================
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

    // ===== USER DATA =====
    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user?.language) return;

    // ===== GUILD SETTINGS =====
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!settings?.enabled_channels) return;

    const channels = await message.guild.channels.fetch();

    // ===== CHANNEL MAP =====
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

    // ===== TRANSLATE =====
    for (const [channelId, targetLang] of channelMap.entries()) {
      if (channelId === message.channel.id) continue;
      if (targetLang === currentLang) continue;

      const channel = channels.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, targetLang);
      if (!translated || translated === content) continue;

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
