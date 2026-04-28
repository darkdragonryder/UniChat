import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from "discord.js";

import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

// ================= COMMANDS =================
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";
import migrateCommand from "./commands/migrate.js";
import addLanguageCommand from "./commands/addlanguage.js";
import repairCommand from "./commands/repair.js";
import unlockCommand from "./commands/channel/unlock.js";
import announceOwnerCommand from "./commands/announce-owner.js";

// ================= EVENTS =================
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
  console.log(`🚀 UniChat v4 ONLINE: ${client.user.tag}`);
});

// ================= EVENTS =================
client.on("guildCreate", guildCreate(client));
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= TRANSLATION + ROLE ENGINE =================
client.on("messageCreate", async (message) => {
  try {

    if (!message.guild || message.author.bot) return;
    if (!message.content || message.content.trim() === "") return;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels;
    if (!channels || typeof channels !== "object") return;

    let sourceLang = null;

    for (const [lang, id] of Object.entries(channels)) {
      if (String(message.channel.id) === String(id)) {
        sourceLang = lang;
        break;
      }
    }

    if (!sourceLang) return;

    // ================= AUTO ROLE ASSIGN =================
    const roleMap = {
      EN: "English",
      ES: "Spanish",
      DE: "German",
      IT: "Italian",
      KO: "Korean",
      RU: "Russian",
      JA: "Japanese"
    };

    const roleName = roleMap[sourceLang];

    if (roleName && message.member) {

      const role = message.guild.roles.cache.find(r => r.name === roleName);

      if (role && !message.member.roles.cache.has(role.id)) {

        const allLangRoles = Object.values(roleMap);

        for (const r of message.member.roles.cache.values()) {
          if (allLangRoles.includes(r.name)) {
            await message.member.roles.remove(r).catch(() => {});
          }
        }

        await message.member.roles.add(role).catch(() => {});

        await message.channel.send({
          content: `🌐 ${message.author}, you've been assigned the **${roleName}** role.`
        }).catch(() => {});
      }
    }

    // ================= TRANSLATION =================
    for (const [lang, id] of Object.entries(channels)) {

      if (lang === sourceLang) continue;

      const channel = await message.guild.channels.fetch(id).catch(() => null);
      if (!channel) continue;

      const translated = await translateCached(message.content, lang);
      if (!translated) continue;

      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setAuthor({
          name: message.member?.displayName || message.author.username,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(translated)
        .setFooter({
          text: `🌍 ${sourceLang} → ${lang}`
        })
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
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

      case "repair":
        return repairCommand(interaction);

      case "unlock":
        return unlockCommand(interaction);

      case "announce-owner":
        return announceOwnerCommand(interaction, client);
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
