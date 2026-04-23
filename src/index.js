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

console.log("🚀 UniChat STARTING");

client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);
});

// ================= DEEPL LANGUAGE DETECTION =================
async function detectLanguage(text) {
  try {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
      },
      body: JSON.stringify({
        text: [text],
        target_lang: "EN"
      })
    });

    const result = await res.json();

    return result?.translations?.[0]?.detected_source_language || "EN";

  } catch (err) {
    console.log("DETECT ERROR:", err.message);
    return "EN";
  }
}

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    if (!content || content.startsWith("/")) return;

    // ================= GET GUILD DATA =================
    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!data) return;

    const enabled = data.enabled_channels ?? {};
    const defaultChannel = data.default_channel;

    // ================= ALWAYS FETCH CHANNELS =================
    const channels = await message.guild.channels.fetch();

    // ================= BUILD CHANNEL MAP =================
    const channelMap = new Map();

    if (defaultChannel && channels.get(defaultChannel)) {
      channelMap.set(defaultChannel, "EN");
    }

    for (const [lang, id] of Object.entries(enabled)) {
      if (channels.get(id)) {
        channelMap.set(id, lang.toUpperCase());
      }
    }

    if (channelMap.size === 0) {
      console.log("⚠️ No channels configured");
      return;
    }

    // ================= DETECT SOURCE LANGUAGE =================
    const sourceLang =
      channelMap.get(message.channel.id) ||
      await detectLanguage(content);

    console.log("SOURCE:", sourceLang);

    // ================= TRANSLATION LOOP =================
    for (const [channelId, targetLang] of channelMap.entries()) {

      if (channelId === message.channel.id) continue;
      if (!targetLang) continue;
      if (targetLang === sourceLang) continue;

      const channel = channels.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, targetLang);

      if (!translated || translated === content) continue;

      await channel.send(`🌍 ${translated}`).catch(err => {
        console.log("SEND ERROR:", err.message);
      });
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

// ================= SLASH COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "setup") {
      return setupCommand(interaction);
    }

    if (interaction.commandName === "uninstall") {
      return uninstallCommand(interaction);
    }

  } catch (err) {
    console.log("COMMAND ERROR:", err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
