import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { execSync } from "child_process";

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

console.log("🚀 UniChat BOT STARTING");

// ================= READY EVENT =================
client.once("ready", () => {
  console.log(`🚀 UniChat BOT ONLINE: ${client.user.tag}`);

  console.log("AUTO_DEPLOY =", process.env.AUTO_DEPLOY);

  if (process.env.AUTO_DEPLOY === "true") {
    try {
      console.log("🔁 Auto deploying slash commands...");
      execSync("node src/deployCommands.js", { stdio: "inherit" });
      console.log("✅ Slash commands deployed");
    } catch (err) {
      console.log("❌ Auto deploy failed:", err.message);
    }
  }
});

// ================= LANGUAGE DETECTION =================
function guessLanguage(text) {
  if (/[а-яё]/i.test(text)) return "RU";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  if (/[ñ¿¡]/.test(text)) return "ES";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[àèìòù]/i.test(text)) return "IT";
  return "EN";
}

const processed = new Set();

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  if (!content || content.startsWith("/")) return;

  if (processed.has(message.id)) return;
  processed.add(message.id);

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

  const sourceLang = channelMap[message.channel.id] || guessLanguage(content);

  await supabase.from("user_settings").upsert({
    user_id: message.author.id,
    language: sourceLang
  });

  for (const [channelId, lang] of Object.entries(channelMap)) {
    if (channelId === message.channel.id) continue;
    if (lang === sourceLang) continue;

    const translated = await translateCached(content, lang);
    const channel = message.guild.channels.cache.get(channelId);
    if (channel) {
      await channel.send(`🌍 ${translated}`);
    }
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "setup") return setupCommand(interaction);
    if (interaction.commandName === "uninstall") return uninstallCommand(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === "setup_use_current") {
      const { supabase } = await import("./services/supabase.js");

      await supabase.from("guild_settings").upsert({
        guild_id: interaction.guild.id,
        default_channel: interaction.channel.id
      });

      return interaction.reply({
        content: "✅ Default channel set",
        ephemeral: true
      });
    }

    if (interaction.customId === "dismiss_uninstall") {
      return interaction.message.delete().catch(() => {});
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId !== "select_default_channel") return;

    const channelId = interaction.values[0];

    await supabase.from("guild_settings").upsert({
      guild_id: interaction.guild.id,
      default_channel: channelId
    });

    return interaction.reply({
      content: `✅ Default channel set to <#${channelId}>`,
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
