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

console.log("🚨 BOT STARTING 🚨");

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 UniChat is ONLINE: ${client.user.tag}`);
});

// ================= MESSAGE MIRROR =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  if (message.content === "!setup") {
    return setupCommand(message);
  }

  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData) return;

  const channels = guildData.enabled_channels || {};
  const allChannels = Object.values(channels);

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
    console.log("❌ MIRROR ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "select_default_channel") return;

  const channelId = interaction.values[0];

  const supabase = (await import("./services/supabase.js")).supabase;

  await supabase.from("guild_settings").upsert({
    guild_id: interaction.guild.id,
    default_channel: channelId
  });

  await interaction.reply({
    content: `✅ Default channel set to <#${channelId}>`,
    ephemeral: true
  });
});

client.login(process.env.DISCORD_TOKEN);
