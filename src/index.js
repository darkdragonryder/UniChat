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
import addLanguageCommand from "./commands/addlanguage.js";

// Events
import guildCreate from "./events/guildCreate.js";
import guildMemberAdd from "./events/guildMemberAdd.js";

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

// ================= TRANSLATION ENGINE =================
client.on("messageCreate", async (message) => {
  try {

    if (!message.guild || message.author.bot) return;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;

    if (!channels || typeof channels !== "object") return;

    if (Object.keys(channels).length === 0) return;

    let sourceLang = null;

    for (const [lang, id] of Object.entries(channels)) {
      if (message.channel.id === id) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    for (const [lang, id] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      try {
        const channel = await message.guild.channels.fetch(id).catch(() => null);
        if (!channel) continue;

        const translated = await translateCached(message.content, lang);
        if (!translated) continue;

        await channel.send({
          content: `🌍 ${sourceLang} → ${lang}: ${translated}`
        }).catch(() => {});

      } catch (err) {
        console.log(`SEND ERROR (${lang}):`, err.message);
      }
    }

  } catch (err) {
    console.log("TRANSLATION ERROR:", err.message);
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

      case "addlanguage":
        return addLanguageCommand(interaction);
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
