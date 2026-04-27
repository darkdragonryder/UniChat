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
  console.log(`🚀 UniChat Bot is ONLINE: ${client.user.tag} (${client.user.id})`);
});

// ================= GUILD MEMBER JOIN =================
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= GUILD CREATE =================
client.on("guildCreate", async (guild) => {
  try {
    const botMember = await guild.members.fetch(client.user.id).catch(() => null);
    if (!botMember) return;

    const keywords = ["bots only", "bots", "bot", "system"];

    let role =
      guild.roles.cache.find(r =>
        keywords.includes(r.name.toLowerCase())
      ) ||
      guild.roles.cache.find(r =>
        keywords.some(k => r.name.toLowerCase().includes(k))
      );

    if (!role) {
      role = await guild.roles.create({
        name: "🤖 UniChat Bot",
        color: 0x5865f2,
        hoist: true,
        mentionable: false,
        reason: "Fallback bot role"
      });
    }

    await botMember.roles.add(role).catch(() => {});

    console.log(`🤖 Bot role ensured in ${guild.name}`);

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isChatInputCommand()) return;

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

      // ================= OWNER ANNOUNCE =================
      case "announce-owner":
        return interaction.reply({
          content: "🌏 UniChat created and maintained by **Dr4gonwolf**",
          ephemeral: false
        });
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
