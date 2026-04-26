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


// ================= MESSAGE TRANSLATION ENGINE =================
client.on("messageCreate", async (message) => {
  try {
    // ===== BASIC GUARDS =====
    if (!message.guild || message.author.bot) return;

    const content = message.content?.trim();
    if (!content || content.startsWith("/")) return;

    // 🔥 LOOP PROTECTION (CRITICAL)
    if (content.startsWith("[UC]")) return;

    // ===== GET USER =====
    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user?.language) return;

    const sourceLang = user.language.toUpperCase();

    // ===== GET GUILD SETTINGS =====
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!settings?.enabled_channels) return;

    const channels = await message.guild.channels.fetch();

    // ===== BUILD CHANNEL MAP =====
    const channelMap = new Map();

    // default English channel
    if (settings.default_channel && channels.get(settings.default_channel)) {
      channelMap.set(settings.default_channel, "EN");
    }

    // language channels
    for (const [lang, id] of Object.entries(settings.enabled_channels)) {
      if (channels.get(id)) {
        channelMap.set(id, lang.toUpperCase());
      }
    }

    if (!channelMap.size) return;

    // ===== DETERMINE SOURCE CHANNEL LANGUAGE =====
    const currentLang = channelMap.get(message.channel.id);
    if (!currentLang) return;

    // ===== TRANSLATE TO OTHER CHANNELS =====
    for (const [channelId, targetLang] of channelMap.entries()) {

      if (channelId === message.channel.id) continue;
      if (targetLang === currentLang) continue;

      const channel = channels.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, targetLang);

      if (!translated || translated === content) continue;

      await channel.send(`🌍 [UC] ${translated}`).catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});


// ================= COMMAND HANDLER =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setup") return setupCommand(interaction);
  if (interaction.commandName === "uninstall") return uninstallCommand(interaction);
  if (interaction.commandName === "setlanguage") return setLanguageCommand(interaction);
});

client.login(process.env.DISCORD_TOKEN);
