import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import setupCommand from "./commands/setup.js";
import { supabase } from "./services/supabase.js";
import { translateText } from "./services/deepl.js";

const log = (m) => console.log(m);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

log("🚨 BOT STARTING 🚨 " + Date.now());

// ================= READY =================
client.once("ready", () => {
  log(`✅ BOT ONLINE: ${client.user.tag}`);
});

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();

  if (content === "!setup") {
    return setupCommand(message);
  }

  if (content === "!desetup") {
    return message.reply("⚠️ Desetup not added in this build yet");
  }

  // ===== LOAD GUILD SETTINGS =====
  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData) return;

  const defaultChannelId = guildData.default_channel;
  const channels = guildData.enabled_channels || {};

  const isDefault = message.channel.id === defaultChannelId;

  const langEntry = Object.entries(channels)
    .find(([lang, id]) => id === message.channel.id);

  try {
    // ================= DEFAULT CHANNEL → ALL LANGUAGES =================
    if (isDefault) {
      for (const [lang, channelId] of Object.entries(channels)) {
        const translated = await translateText(content, lang.toUpperCase());

        const ch = message.guild.channels.cache.get(channelId);
        if (ch) ch.send(`🌍 ${translated}`);
      }
      return;
    }

    // ================= LANGUAGE CHANNEL → ENGLISH =================
    if (langEntry) {
      const lang = langEntry[0];

      const translated = await translateText(content, "EN");

      const englishChannel = message.guild.channels.cache.get(defaultChannelId);
      if (englishChannel) {
        englishChannel.send(`🌍 [${lang.toUpperCase()}] ${translated}`);
      }
    }

  } catch (err) {
    log("❌ ERROR: " + err.message);
  }
});

// ================= INTERACTION HANDLER =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId !== "select_default_channel") return;

  const channelId = interaction.values[0];

  try {
    await supabase.from("guild_settings").upsert({
      guild_id: interaction.guild.id,
      default_channel: channelId,
      enabled_channels: {} // will be filled in setup later
    });

    await interaction.reply({
      content: `✅ Default channel set to <#${channelId}>`,
      ephemeral: true
    });

  } catch (err) {
    console.log("❌ DB ERROR:", err.message);

    await interaction.reply({
      content: "❌ Failed to save setup",
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
