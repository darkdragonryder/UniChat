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

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);
});


// ================= MESSAGE PIPELINE =================
client.on("messageCreate", async (message) => {
  try {
    // ================= GUARDS =================
    if (!message.guild || message.author.bot) return;

    const content = message.content?.trim();
    if (!content) return;

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

    // ================= DB LOAD (SOURCE OF TRUTH) =================
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!settings) return;

    const { default_channel, enabled_channels } = settings;

    // ================= ALWAYS FRESH STATE =================
    const channels = await message.guild.channels.fetch();

    // ================= BUILD ROUTING MAP =================
    const targets = [];

    // English channel
    if (default_channel && channels.get(default_channel)) {
      targets.push({
        id: default_channel,
        lang: "EN"
      });
    }

    // Language channels
    for (const [lang, id] of Object.entries(enabled_channels || {})) {
      if (channels.get(id)) {
        targets.push({
          id,
          lang: lang.toUpperCase()
        });
      }
    }

    if (targets.length === 0) return;

    // ================= TRANSLATION SEND LOOP =================
    for (const target of targets) {
      const channel = channels.get(target.id);
      if (!channel) continue;

      // skip only same-language same-channel
      if (target.lang === sourceLang && target.id === default_channel) continue;

      try {
        const translated = await translateCached(content, target.lang);
        if (!translated) continue;

        await channel.send(`🌍 ${translated}`);

      } catch (err) {
        console.log("Translate error:", err.message);
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
