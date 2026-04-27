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
import guildCreate from "./events/guildCreate.js";

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

// ================= GUILD JOIN ANIMATION =================
client.on("guildCreate", guildCreate(client));

// ================= MEMBER JOIN =================
client.on("guildMemberAdd", guildMemberAdd(client));

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

    // ================= SETUP WIZARD BUTTONS =================
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
