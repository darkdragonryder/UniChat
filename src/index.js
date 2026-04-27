import "dotenv/config";
import {
  Client,
  GatewayIntentBits
} from "discord.js";

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

// Commands
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";
import migrateCommand from "./commands/migrate.js";

// Events
import guildCreate from "./events/guildCreate.js";
import guildMemberAdd from "./events/guildMemberAdd.js";

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= READY =================
client.once("ready", () => {
  console.log(`🚀 UniChat STABLE v3.1 ONLINE: ${client.user.tag}`);
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= 🌍 TRANSLATION ENGINE (HARDENED v3.1) =================
client.on("messageCreate", async (message) => {
  try {

    if (!message.guild || message.author.bot) return;

    // ================= FETCH SAFE CONFIG =================
    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;

    // ================= SAFETY CHECK (IMPORTANT) =================
    if (!channels || typeof channels !== "object") return;

    // OPTIONAL STRONG RECOMMENDED GUARD
    if (Object.keys(channels).length === 0) {
      console.log(`⚠️ No channels configured for guild ${message.guild.id}`);
      return;
    }

    // ================= FIND SOURCE LANGUAGE =================
    let sourceLang = null;

    for (const [lang, channelId] of Object.entries(channels)) {
      if (message.channel.id === channelId) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    // ================= TRANSLATE TO ALL OTHER CHANNELS =================
    for (const [lang, channelId] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      try {

        const channel = await message.guild.channels.fetch(channelId)
          .catch(() => null);

        if (!channel) {
          console.log(`⚠️ Missing channel for ${lang} in guild ${message.guild.id}`);
          continue;
        }

        const translated = await translateCached(message.content, lang);
        if (!translated) continue;

        await channel.send({
          content: `🌍 ${sourceLang} → ${lang}: ${translated}`
        }).catch((err) => {
          console.log(`SEND ERROR (${lang}):`, err.message);
        });

      } catch (err) {
        console.log(`CHANNEL ERROR (${lang}):`, err.message);
      }
    }

  } catch (err) {
    console.log("TRANSLATION ENGINE CRASH SAFE:", err.message);
  }
});

// ================= COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {

      case "setup":
        return setupCommand(interaction, client);

      case "uninstall":
        return uninstallCommand(interaction);

      case "setlanguage":
        return setLanguageCommand(interaction);

      case "help":
        return helpCommand(interaction);

      case "info":
        return infoCommand(interaction, client);

      case "migrate":
        return migrateCommand(interaction);
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
