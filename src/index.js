import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import setLanguageCommand from "./commands/setlanguage.js";
import { sendLanguagePrompt } from "./utils/languagePrompt.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);
});

// ================= JOIN =================
client.on("guildMemberAdd", async (member) => {
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", member.id)
    .maybeSingle();

  if (!data && member.guild.systemChannel) {
    await sendLanguagePrompt(member.guild.systemChannel, member.id);
  }
});

// ================= MESSAGE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  if (!content || content.startsWith("/")) return;

  // USER
  const { data: user } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", message.author.id)
    .maybeSingle();

  if (!user) {
    await sendLanguagePrompt(message.channel, message.author.id);
    return;
  }

  // GUILD SETTINGS
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .maybeSingle();

  if (!data) return;

  const enabled = data.enabled_channels ?? {};
  const channels = await message.guild.channels.fetch();

  const sourceLang = (user.language || "EN").toUpperCase();

  for (const [targetLang, channelId] of Object.entries(enabled)) {

    if (targetLang.toUpperCase() === sourceLang) continue;

    const channel = channels.get(channelId);
    if (!channel) continue;

    const translated = await translateCached(content, targetLang);

    if (!translated || translated === content) continue;

    await channel.send(`🌍 ${translated}`).catch(() => {});
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  // LANGUAGE SELECT
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId !== "select_language") return;

    const lang = interaction.values[0];
    const guild = interaction.guild;

    await supabase.from("user_settings").upsert({
      user_id: interaction.user.id,
      language: lang
    });

    const roleMap = {
      EN: "English",
      ES: "Spanish",
      DE: "German",
      IT: "Italian",
      KO: "Korean",
      RU: "Russian",
      JA: "Japanese"
    };

    const member = await guild.members.fetch(interaction.user.id);

    // REMOVE OLD ROLES
    for (const name of Object.values(roleMap)) {
      const role = guild.roles.cache.find(r => r.name === name);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    // ADD NEW ROLE
    const newRole = guild.roles.cache.find(
      r => r.name === roleMap[lang]
    );

    if (newRole) {
      await member.roles.add(newRole).catch(() => {});
    }

    return interaction.update({
      content: "✅ Language set!",
      components: [],
      embeds: []
    });
  }

  // COMMANDS
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
});

client.login(process.env.DISCORD_TOKEN);
