import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

// Commands
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag} (${client.user.id})`);
});

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  try {
    // SAFETY BLOCK
    if (!message.guild) return;
    if (message.author.bot) return;

    const content = message.content?.trim();
    if (!content || content.startsWith("/")) return;

    // ================= USER =================
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

    const channelsData = settings?.enabled_channels || {};

    if (!Object.keys(channelsData).length) return;

    const channels = await message.guild.channels.fetch();

    const entries = Object.entries(channelsData);

    // ================= TRANSLATION ROUTING =================
    for (const [lang, channelId] of entries) {
      const channel = channels.get(channelId);
      if (!channel) continue;

      if (lang.toUpperCase() === sourceLang) continue;

      const translated = await translateCached(content, lang);
      if (!translated) continue;

      await channel.send({
        content: `🌍 ${translated}`,
        allowedMentions: { parse: [] } // 🔒 safety: prevents @everyone spam
      }).catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

// ================= COMMAND HANDLER =================
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
