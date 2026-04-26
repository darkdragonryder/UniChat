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
  console.log(`✅ ONLINE: ${client.user.tag}`);
});


// ================= MESSAGE SYSTEM =================
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

    // ================= ONBOARDING DETECTION =================
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

    const channels = await message.guild.channels.fetch();

    // ================= CHANNEL MAP =================
    const channelMap = new Map();

    if (default_channel && channels.get(default_channel)) {
      channelMap.set(default_channel, "EN");
    }

    for (const [lang, id] of Object.entries(enabled_channels || {})) {
      if (channels.get(id)) {
        channelMap.set(id, lang.toUpperCase());
      }
    }

    if (!channelMap.size) return;

    // ================= TRANSLATION BROADCAST =================
    for (const [channelId, targetLang] of channelMap.entries()) {

      const channel = channels.get(channelId);
      if (!channel) continue;

      if (targetLang === sourceLang) continue;

      const translated = await translateCached(content, targetLang);

      if (!translated || translated === content) continue;

      await channel.send(`🌍 ${translated}`).catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});


// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  // ================= BUTTON SYSTEM =================
  if (interaction.isButton()) {

    const member = await interaction.guild.members.fetch(interaction.user.id);

    // ================= ACCEPT LANGUAGE =================
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

      const roleName = roleMap[lang];
      const role = interaction.guild.roles.cache.find(r => r.name === roleName);

      if (role) await member.roles.add(role).catch(() => {});

      // 🔒 re-apply locks after role assignment
      const { data: settings } = await supabase
        .from("guild_settings")
        .select("*")
        .eq("guild_id", interaction.guild.id)
        .maybeSingle();

      if (settings) {
        await applyChannelLocks(interaction.guild, settings);
      }

      return interaction.update({
        content: `✅ Language set to **${lang}**`,
        components: []
      });
    }

    // ================= DECLINE =================
    if (interaction.customId === "lang_no") {
      return interaction.update({
        content: "👍 No problem — use /setlanguage anytime",
        components: []
      });
    }
  }

  // ================= SLASH COMMANDS =================
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
