import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

console.log("🚀 UniChat STARTING");

client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);
});

// ================= LANGUAGE DETECTION =================
function guessLanguage(text) {
  if (/[а-яё]/i.test(text)) return "RU";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  if (/[ñ¿¡]/.test(text)) return "ES";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[àèìòù]/i.test(text)) return "IT";
  return "EN";
}

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  if (!content || content.startsWith("/")) return;

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .maybeSingle();

  if (!data) return;

  const enabled = data.enabled_channels ?? {};
  const defaultChannel = data.default_channel;

  const channels = await message.guild.channels.fetch();

  const channelMap = new Map();

  if (defaultChannel) channelMap.set(defaultChannel, "EN");

  for (const [lang, id] of Object.entries(enabled)) {
    if (channels.get(id)) {
      channelMap.set(id, lang.toUpperCase());
    }
  }

  const sourceLang =
    channelMap.get(message.channel.id) || guessLanguage(content);

  for (const [channelId, targetLang] of channelMap.entries()) {

    if (channelId === message.channel.id) continue;
    if (targetLang === sourceLang) continue;

    const channel = channels.get(channelId);
    if (!channel) continue;

    const translated = await translateCached(content, targetLang);

    if (!translated) continue;

    await channel.send(`🌍 ${translated}`).catch(() => {});
  }
});

// ================= COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setup") {
    return setupCommand(interaction);
  }

  if (interaction.commandName === "uninstall") {
    return uninstallCommand(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);
