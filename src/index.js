import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";

import { detectLang } from "./utils/detectLang.js";
import { languageSuggestion } from "./utils/languageSuggestion.js";
import { applyChannelLocks } from "./utils/applyChannelLocks.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`🚀UniChat Bot is ONLINE: ${client.user.tag}`);
});


// ================= MESSAGE HANDLER =================
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    if (!content || content.startsWith("/")) return;

    // ================= USER DATA =================
    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    // ================= ONBOARDING =================
    if (!user?.language) {

      const detected = detectLang(content);

      if (detected && detected !== "EN") {

        const prompt = await message.reply({
          content: `🌍 We think you're speaking **${detected}**. Set this as your language?`,
          components: languageSuggestion(detected)
        });

        await supabase.from("language_suggestions").upsert({
          user_id: message.author.id,
          suggested: detected,
          message_id: prompt.id
        });
      }

      return;
    }

    const sourceLang = (user.language || "EN").toUpperCase();

    // ================= GUILD SETTINGS =================
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!settings) return;

    const { default_channel, enabled_channels } = settings;

    // ================= CRITICAL FIX: ALWAYS FRESH FETCH =================
    await message.guild.channels.fetch();

    // ================= STABLE ROUTING MAP =================
    const channelMap = new Map();

    // English source channel
    if (default_channel) {
      const ch = message.guild.channels.cache.get(default_channel);
      if (ch) channelMap.set(default_channel, "EN");
    }

    // Language channels
    for (const [lang, id] of Object.entries(enabled_channels || {})) {
      const ch = message.guild.channels.cache.get(id);
      if (ch) channelMap.set(id, lang.toUpperCase());
    }

    if (channelMap.size === 0) return;

    // ================= TRANSLATION LOOP (FIXED CORE) =================
    for (const [channelId, targetLang] of channelMap.entries()) {

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      // only skip SAME language in SAME channel
      if (targetLang === sourceLang && channelId === default_channel) continue;

      try {
        const translated = await translateCached(content, targetLang);

        if (!translated) continue;

        await channel.send(`🌍 ${translated}`);

      } catch (err) {
        console.log("Translate send error:", err.message);
      }
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});


// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  if (interaction.isButton()) {

    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (interaction.customId.startsWith("lang_yes_")) {

      const lang = interaction.customId.split("_")[2];

      await supabase.from("user_settings").upsert({
        user_id: interaction.user.id,
        language: lang
      });

      const roleMap = {
        ES: "Spanish",
        DE: "German",
        IT: "Italian",
        KO: "Korean",
        RU: "Russian",
        JA: "Japanese"
      };

      const role = interaction.guild.roles.cache.find(
        r => r.name === roleMap[lang]
      );

      if (role) await member.roles.add(role).catch(() => {});

      const { data: settings } = await supabase
        .from("guild_settings")
        .select("*")
        .eq("guild_id", interaction.guild.id)
        .maybeSingle();

      if (settings) {
        setTimeout(() => {
          applyChannelLocks(interaction.guild, settings).catch(() => {});
        }, 3000);
      }

      return interaction.update({
        content: `✅ Language set to **${lang}**`,
        components: []
      });
    }

    if (interaction.customId === "lang_no") {
      return interaction.update({
        content: "👍 No problem — use /setlanguage anytime",
        components: []
      });
    }
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setup") {
    return setupCommand(interaction);
  }

  if (interaction.commandName === "uninstall") {
    return uninstallCommand(interaction);
  }

  if (interaction.commandName === "setlanguage") {
    return setLanguageCommand(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);
