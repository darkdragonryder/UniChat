import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";

// Commands
import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import helpCommand from "./commands/help.js";
import infoCommand from "./commands/info.js";

// Events
import guildMemberAdd from "./events/guildMemberAdd.js";
import guildCreate from "./events/guildCreate.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages // ✅ REQUIRED for tracking
  ]
});

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag} (${client.user.id})`);
});

// ================= GUILD JOIN =================
client.on("guildCreate", guildCreate(client));

// ================= MEMBER JOIN =================
client.on("guildMemberAdd", guildMemberAdd(client));

// ================= 📊 ACTIVITY TRACKER =================
// (THIS replaces needing a separate file)
client.on("messageCreate", async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;

    await supabase.from("guild_settings").upsert({
      guild_id: message.guild.id,
      active_channel: message.channel.id
    });

  } catch (err) {
    console.log("ACTIVITY TRACK ERROR:", err.message);
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
          return infoCommand(interaction, client);

        case "announce-owner":
          return interaction.reply({
            content: "🌏 UniChat created by **Dr4gonwolf**",
            ephemeral: false
          });
      }
    }

    // ================= SETUP WIZARD BUTTON =================
    if (interaction.isButton()) {
      if (interaction.customId === "setup_start") {

        await interaction.update({
          content: "🌍 Step 1: Initializing UniChat system...",
          embeds: [],
          components: []
        });

        return setupCommand(interaction);
      }
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
