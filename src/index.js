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

console.log("🚀 UniChat PHASE 7 ONLINE");

// ================= LANGUAGE DETECTION =================
function guessLanguage(text) {
  const t = text.toLowerCase();

  if (/[а-яё]/i.test(text)) return "RU";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  if (/[ñ¿¡]/.test(text)) return "ES";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[àèìòù]/i.test(text)) return "IT";

  const englishHints = /\b(the|and|is|hello|you|this|that)\b/i.test(t);
  if (englishHints) return "EN";

  return "EN";
}

const processed = new Set();

// ================= MESSAGE TRANSLATION ENGINE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();
  if (!content) return;

  if (content.startsWith("/")) return;

  const key = message.id;
  if (processed.has(key)) return;
  processed.add(key);

  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData) return;

  const channels = guildData.enabled_channels || {};
  const defaultChannel = guildData.default_channel;

  const channelMap = {
    [defaultChannel]: "EN",
    ...Object.entries(channels).reduce((acc, [lang, id]) => {
      acc[id] = lang.toUpperCase();
      return acc;
    }, {})
  };

  const sourceLang =
    channelMap[message.channel.id] || guessLanguage(content);

  await supabase.from("user_settings").upsert({
    user_id: message.author.id,
    language: sourceLang
  });

  const roleMap = {
    ES: "Spanish",
    DE: "German",
    IT: "Italian",
    KO: "Korean",
    RU: "Russian"
  };

  const roleName = roleMap[sourceLang];

  if (roleName) {
    try {
      const role = message.guild.roles.cache.find(r => r.name === roleName);
      const member = await message.guild.members.fetch(message.author.id);

      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }
    } catch (err) {
      console.log("ROLE ERROR:", err.message);
    }
  }

  try {
    for (const [channelId, targetLang] of Object.entries(channelMap)) {
      if (channelId === message.channel.id) continue;
      if (targetLang === sourceLang) continue;

      const translated = await translateCached(content, targetLang);

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      await channel.send(`🌍 ${translated}`);
    }
  } catch (err) {
    console.log("TRANSLATION ERROR:", err.message);
  }
});

// ================= SLASH COMMANDS =================
client.on("interactionCreate", async (interaction) => {

  // ================= SLASH COMMAND HANDLER =================
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "setup") {
      return setupCommand(interaction);
    }

    if (interaction.commandName === "uninstall") {
      return uninstallCommand(interaction);
    }
  }

  // ================= BUTTON HANDLER =================
  if (interaction.isButton()) {

    const { customId } = interaction;

    // USE CURRENT CHANNEL
    if (customId === "setup_use_current") {
      const { supabase } = await import("./services/supabase.js");

      await supabase.from("guild_settings").upsert({
        guild_id: interaction.guild.id,
        default_channel: interaction.channel.id
      });

      return interaction.reply({
        content: "✅ Current channel set as default",
        ephemeral: true
      });
    }

    // PICK CHANNEL MENU TRIGGER
    if (customId === "setup_pick_channel") {
      return interaction.reply({
        content: "⚠️ Channel picker will be handled in next step of setup.",
        ephemeral: true
      });
    }

    // UNINSTALL DISMISS
    if (customId === "dismiss_uninstall") {
      return interaction.message.delete().catch(() => {});
    }
  }

  // ================= SELECT MENU HANDLER =================
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId !== "select_default_channel") return;

    const channelId = interaction.values[0];

    await supabase.from("guild_settings").upsert({
      guild_id: interaction.guild.id,
      default_channel: channelId
    });

    await interaction.reply({
      content: `✅ Default channel set to <#${channelId}>`,
      ephemeral: true
    });

    setTimeout(() => {
      interaction.message.delete().catch(() => {});
    }, 3000);
  }
});

client.login(process.env.DISCORD_TOKEN);
