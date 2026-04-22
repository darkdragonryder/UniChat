import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import setupCommand from "./commands/setup.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

console.log("🚨 PHASE 5 SYSTEM ONLINE 🚨");

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ BOT ONLINE: ${client.user.tag}`);
});

// ================= LANGUAGE GUESS =================
function guessLanguage(text) {
  if (/[àèìòù]/i.test(text)) return "IT";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[ñ¿¡]/i.test(text)) return "ES";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  return "EN";
}

// ================= MESSAGE ENGINE =================
const processed = new Set();

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (!message.guild) return;

  const content = message.content.trim();
  if (!content) return;

  const key = `${message.id}`;
  if (processed.has(key)) return;
  processed.add(key);

  if (content === "!setup") return setupCommand(message);

  // ================= LOAD GUILD DATA =================
  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData) return;

  const channels = guildData.enabled_channels || {};
  const defaultChannel = guildData.default_channel;

  // ================= CHANNEL MAP =================
  const channelMap = {
    [defaultChannel]: "EN",
    ...Object.entries(channels).reduce((acc, [lang, id]) => {
      acc[id] = lang.toUpperCase();
      return acc;
    }, {})
  };

  const sourceLang = channelMap[message.channel.id] || guessLanguage(content);
  const allChannelIds = Object.keys(channelMap);

  // ================= SAVE USER LANGUAGE =================
  await supabase.from("user_settings").upsert({
    user_id: message.author.id,
    language: sourceLang
  });

  // ================= ROLE ASSIGN =================
  const roleMap = {
    ES: "Spanish",
    DE: "German",
    IT: "Italian",
    KO: "Korean"
  };

  const roleName = roleMap[sourceLang];

  if (roleName) {
    const role = message.guild.roles.cache.find(r => r.name === roleName);
    const member = await message.guild.members.fetch(message.author.id);

    if (role && member && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
    }
  }

  // ================= MIRROR TRANSLATION =================
  try {
    for (const targetChannelId of allChannelIds) {
      if (targetChannelId === message.channel.id) continue;

      const targetLang = channelMap[targetChannelId];
      if (!targetLang || targetLang === sourceLang) continue;

      const translated = await translateCached(
        content,
        targetLang === "EN" ? "EN" : targetLang
      );

      const channel = message.guild.channels.cache.get(targetChannelId);
      if (!channel) continue;

      await channel.send(`🌍 ${translated}`);
    }

  } catch (err) {
    console.log("❌ PHASE 5 ERROR:", err.message);
  }
});

// ================= INTERACTION =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
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
});

client.login(process.env.DISCORD_TOKEN);
