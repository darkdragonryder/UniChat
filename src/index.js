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

log("🚨 UNI CHAT MIRROR BOT STARTING 🚨 " + Date.now());

// ================= READY =================
client.once("ready", () => {
  log(`✅ BOT ONLINE: ${client.user.tag}`);
});

// ================= SETUP COMMAND =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();

  if (content === "!setup") return setupCommand(message);

  // ================= LOAD SETTINGS =================
  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData) return;

  const channels = guildData.enabled_channels || {};
  const defaultChannel = guildData.default_channel;

  const allChannels = Object.values(channels);
  if (defaultChannel) allChannels.push(defaultChannel);

  // ignore non-managed channels
  if (!allChannels.includes(message.channel.id)) return;

  try {
    for (const channelId of allChannels) {
      if (channelId === message.channel.id) continue;

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      const translated = await translateText(message.content, "EN");

      await channel.send(`🌍 ${translated}`);
    }

  } catch (err) {
    log("❌ MIRROR ERROR: " + err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "select_default_channel") return;

  const channelId = interaction.values[0];

  log("📌 DEFAULT CHANNEL SET: " + channelId);

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
    log("❌ DB ERROR: " + err.message);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Failed to save setup",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
