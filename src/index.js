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

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag} (${client.user.id})`);
});

// ================= REGISTER EVENTS =================
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= MESSAGE ENGINE =================
client.on("messageCreate", async (message) => {
  try {
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

    // ================= GUILD =================
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    const channelsData = settings?.enabled_channels || {};
    if (!Object.keys(channelsData).length) return;

    const channels = await message.guild.channels.fetch();

    // ================= TRANSLATE =================
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
    // ================= SLASH COMMANDS =================
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "setup") {
        return setupCommand(interaction);
      }

      if (interaction.commandName === "uninstall") {
        return uninstallCommand(interaction);
      }

      if (interaction.commandName === "setlanguage") {
        return setLanguageCommand(interaction);
      }

      if (interaction.commandName === "help") {
        return helpCommand(interaction);
      }

      if (interaction.commandName === "info") {
        return infoCommand(interaction);
      }
    }

    // ================= LANGUAGE SELECT =================
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "select_language") {

        const lang = interaction.values[0];
        const guild = interaction.guild;
        const member = await guild.members.fetch(interaction.user.id);

        const roleNames = {
          EN: "English",
          ES: "Spanish",
          DE: "German",
          IT: "Italian",
          KO: "Korean",
          RU: "Russian",
          JA: "Japanese"
        };

        // REMOVE OLD ROLES
        for (const name of Object.values(roleNames)) {
          const role = guild.roles.cache.find(r => r.name === name);
          if (role) await member.roles.remove(role).catch(() => {});
        }

        // ADD NEW ROLE
        const newRole = guild.roles.cache.find(r => r.name === roleNames[lang]);
        if (newRole) await member.roles.add(newRole).catch(() => {});

        // SAVE TO DB
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

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
