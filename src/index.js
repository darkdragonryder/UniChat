import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import setupCommand from "./commands/setup.js";
import { supabase } from "./services/supabase.js";
import { translateText } from "./services/deepl.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

console.log("🚨 UNI CHAT PHASE 3 STARTING 🚨");

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ BOT ONLINE: ${client.user.tag}`);
});

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (!message.guild) return;

  const content = message.content.trim();
  if (!content) return;

  if (content === "!setup") {
    return setupCommand(message);
  }

  // ================= LOAD GUILD SETTINGS =================
  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData) return;

  const defaultChannel = guildData.default_channel;
  const channels = guildData.enabled_channels || {};

  // ================= BUILD CHANNEL MAP =================
  const channelMap = {
    [defaultChannel]: "EN",
    ...Object.entries(channels).reduce((acc, [lang, id]) => {
      acc[id] = lang.toUpperCase();
      return acc;
    }, {})
  };

  const sourceLang = channelMap[message.channel.id];
  if (!sourceLang) return;

  const allChannelIds = Object.keys(channelMap);

  try {
    for (const targetChannelId of allChannelIds) {
      if (targetChannelId === message.channel.id) continue;

      const targetLang = channelMap[targetChannelId];

      if (!targetLang || targetLang === sourceLang) continue;

      const translated = await translateText(
        content,
        targetLang === "EN" ? "EN" : targetLang
      );

      const channel = message.guild.channels.cache.get(targetChannelId);
      if (!channel) continue;

      await channel.send(`🌍 ${translated}`);
    }
  } catch (err) {
    console.log("❌ PHASE 3 ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "select_default_channel") return;

  const channelId = interaction.values[0];

  console.log("📌 Default channel set:", channelId);

  try {
    await supabase.from("guild_settings").upsert({
      guild_id: interaction.guild.id,
      default_channel: channelId,
      enabled_channels: {}
    });

    await interaction.reply({
      content: `✅ Default channel set to <#${channelId}>`,
      ephemeral: true
    });

  } catch (err) {
    console.log("❌ DB ERROR:", err.message);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Failed to save setup",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
