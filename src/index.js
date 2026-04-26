import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";

import { recoverGuild } from "./utils/recoverGuild.js";

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= SELF-HEAL CACHE =================
const recoveredGuilds = new Set();

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);

  // FULL RECOVERY ON START
  for (const guild of client.guilds.cache.values()) {
    await recoverGuild(guild);
  }
});

// ================= MESSAGE PIPELINE =================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const content = message.content?.trim();
    if (!content || content.startsWith("/")) return;

    // ================= FULL RECOVERY (ONCE PER GUILD) =================
    if (!recoveredGuilds.has(message.guild.id)) {
      recoveredGuilds.add(message.guild.id);
      await recoverGuild(message.guild);
    }

    // ================= USER SETTINGS =================
    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user?.language) return;

    const sourceLang = user.language.toUpperCase();

    // ================= GUILD SETTINGS =================
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!settings?.enabled_channels) return;

    const channels = await message.guild.channels.fetch();

    for (const [lang, channelId] of Object.entries(settings.enabled_channels)) {
      const channel = channels.get(channelId);
      if (!channel) continue;

      if (lang.toUpperCase() === sourceLang) continue;

      const translated = await translateCached(content, lang);
      if (!translated) continue;

      await channel.send(`🌍 ${translated}`).catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {
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

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
