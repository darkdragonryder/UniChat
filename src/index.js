import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= SELF HEAL CACHE =================
const healedGuilds = new Set();

// ================= SELF HEAL FUNCTION =================
async function selfHealGuild(guild) {
  try {
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (!settings) return;

    const channels = await guild.channels.fetch();

    let changed = false;
    const fixed = { ...(settings.enabled_channels || {}) };

    for (const [lang, channelId] of Object.entries(fixed)) {
      if (!channels.get(channelId)) {
        delete fixed[lang];
        changed = true;
      }
    }

    if (changed) {
      await supabase
        .from("guild_settings")
        .update({ enabled_channels: fixed })
        .eq("guild_id", guild.id);

      console.log(`🛠️ Self-healed guild: ${guild.name}`);
    }

  } catch (err) {
    console.log("SELF HEAL ERROR:", err.message);
  }
}

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await selfHealGuild(guild);
  }
});

// ================= MESSAGE PIPELINE =================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const content = message.content?.trim();
    if (!content || content.startsWith("/")) return;

    // ================= SELF HEAL (ONCE PER GUILD) =================
    if (!healedGuilds.has(message.guild.id)) {
      healedGuilds.add(message.guild.id);
      await selfHealGuild(message.guild);
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

    const entries = Object.entries(settings.enabled_channels);

    for (const [lang, channelId] of entries) {
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
