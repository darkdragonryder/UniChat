import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

// Commands
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";
import announceOwner from "./commands/announceOwner.js";

// Events
import guildMemberAdd from "./events/guildMemberAdd.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`🚀 UniChat Bot is ONLINE: ${client.user.tag}`);
});

client.on("guildMemberAdd", guildMemberAdd(client));

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const content = message.content?.trim();
    if (!content || content.startsWith("/")) return;

    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user?.language) return;

    const sourceLang = user.language.toUpperCase();

    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channelsData = settings?.enabled_channels || {};
    if (!Object.keys(channelsData).length) return;

    const channels = await message.guild.channels.fetch();

    for (const [lang, channelId] of Object.entries(channelsData)) {
      if (lang.toUpperCase() === sourceLang) continue;

      const channel = channels.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, lang);
      if (!translated) continue;

      await channel.send({
        content: `🌍 ${translated}`,
        allowedMentions: { parse: [] }
      }).catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "setup") return setupCommand(interaction);
      if (interaction.commandName === "uninstall") return uninstallCommand(interaction);
      if (interaction.commandName === "setlanguage") return setLanguageCommand(interaction);
      if (interaction.commandName === "help") return helpCommand(interaction);
      if (interaction.commandName === "info") return infoCommand(interaction);
      if (interaction.commandName === "announce-owner") return announceOwner(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "select_language") {

        const lang = interaction.values[0];
        const member = await interaction.guild.members.fetch(interaction.user.id);

        const roleNames = {
          EN: "English",
          ES: "Spanish",
          DE: "German",
          IT: "Italian",
          KO: "Korean",
          RU: "Russian",
          JA: "Japanese"
        };

        for (const name of Object.values(roleNames)) {
          const role = interaction.guild.roles.cache.find(r => r.name === name);
          if (role) await member.roles.remove(role).catch(() => {});
        }

        const newRole = interaction.guild.roles.cache.find(
          r => r.name === roleNames[lang]
        );

        if (newRole) await member.roles.add(newRole).catch(() => {});

        await supabase.from("user_settings").upsert({
          user_id: interaction.user.id,
          language: lang
        });

        await interaction.reply({
          content: `🌍 Language set to ${roleNames[lang]}`,
          ephemeral: true
        });
      }
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
