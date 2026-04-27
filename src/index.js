import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

// ================= COMMANDS =================
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";

// ================= EVENTS =================
import guildMemberAdd from "./events/guildMemberAdd.js";

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag} (${client.user.id})`);
});

// ================= GUILD MEMBER JOIN =================
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= GUILD CREATE (BOT ROLE FALLBACK) =================
client.on("guildCreate", async (guild) => {
  try {
    const botMember = await guild.members.fetch(client.user.id).catch(() => null);
    if (!botMember) return;

    const keywords = ["bots only", "bots", "bot", "system"];

    // Try find existing bot role
    let role =
      guild.roles.cache.find(r =>
        keywords.includes(r.name.toLowerCase())
      ) ||
      guild.roles.cache.find(r =>
        keywords.some(k => r.name.toLowerCase().includes(k))
      );

    // Create fallback role if none exists
    if (!role) {
      role = await guild.roles.create({
        name: "🤖 UniChat Bot",
        color: 0x5865f2,

        // 👇 shows separately in member list (important fix)
        hoist: true,

        // 👇 prevents @everyone spam
        mentionable: false,

        reason: "Fallback UniChat bot role"
      });
    }

    // Assign role to bot
    await botMember.roles.add(role).catch(() => {});

    console.log(`🤖 Bot role ensured in ${guild.name}`);

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {

    // ================= SLASH COMMANDS =================
    if (interaction.isChatInputCommand()) {

      switch (interaction.commandName) {

        case "setup":
          return setupCommand(interaction);

        case "uninstall":
          return uninstallCommand(interaction);

        case "setlanguage":
          return setLanguageCommand(interaction);

        case "help":
          return helpCommand(interaction);

        case "info":
          return infoCommand(interaction);
      }
    }

    // ================= LANGUAGE SELECT MENU =================
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

        // REMOVE OLD LANGUAGE ROLES
        for (const name of Object.values(roleNames)) {
          const role = guild.roles.cache.find(r => r.name === name);
          if (role) await member.roles.remove(role).catch(() => {});
        }

        // ADD NEW ROLE
        const newRole = guild.roles.cache.find(r => r.name === roleNames[lang]);
        if (newRole) await member.roles.add(newRole).catch(() => {});

        // SAVE TO DATABASE
        await supabase.from("user_settings").upsert({
          user_id: interaction.user.id,
          language: lang
        });

        return interaction.reply({
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
