import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { supabase } from "./services/supabase.js";
import { translateCached } from "./services/cacheTranslate.js";

import setupCommand from "./commands/setup.js";
import uninstallCommand from "./commands/uninstall.js";
import { sendLanguagePrompt } from "./utils/languagePrompt.js";
import { commandData as setLanguageData } from "./commands/setlanguage.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

console.log("🚀 UniChat STARTING");

client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);
});


// ================= USER JOIN =================
client.on("guildMemberAdd", async (member) => {
  try {
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", member.id)
      .maybeSingle();

    if (!data) {
      const channel = member.guild.systemChannel;
      if (channel) {
        await sendLanguagePrompt(channel, member.id);
      }
    }
  } catch (err) {
    console.log("JOIN ERROR:", err.message);
  }
});


// ================= MESSAGE HANDLER =================
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    if (!content || content.startsWith("/")) return;

    // ================= CHECK USER LANGUAGE =================
    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user) {
      await sendLanguagePrompt(message.channel, message.author.id);
      return;
    }

    // ================= GET GUILD CONFIG =================
    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!data) return;

    const enabled = data.enabled_channels ?? {};
    const defaultChannel = data.default_channel;

    // ================= FETCH CHANNELS =================
    const channels = await message.guild.channels.fetch();

    const channelMap = new Map();

    if (defaultChannel && channels.get(defaultChannel)) {
      channelMap.set(defaultChannel, "EN");
    }

    for (const [lang, id] of Object.entries(enabled)) {
      if (channels.get(id)) {
        channelMap.set(id, lang.toUpperCase());
      }
    }

    if (channelMap.size === 0) return;

    const sourceLang = user.language || "EN";

    // ================= TRANSLATE =================
    for (const [channelId, targetLang] of channelMap.entries()) {

      if (channelId === message.channel.id) continue;
      if (!targetLang) continue;
      if (targetLang === sourceLang) continue;

      const channel = channels.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, targetLang);

      if (!translated || translated === content) continue;

      await channel.send(`🌍 ${translated}`).catch(err => {
        console.log("SEND ERROR:", err.message);
      });
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});


// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  try {

    // ================= LANGUAGE SELECT =================
    if (interaction.isStringSelectMenu()) {

      if (interaction.customId !== "select_language") return;

      const lang = interaction.values[0];
      const guild = interaction.guild;

      // SAVE USER LANGUAGE
      await supabase.from("user_settings").upsert({
        user_id: interaction.user.id,
        language: lang
      });

      // ROLE NAME MAP
      const roleNames = {
        EN: "English",
        ES: "Spanish",
        DE: "German",
        IT: "Italian",
        KO: "Korean",
        RU: "Russian",
        JA: "Japanese"
      };

      const role = guild.roles.cache.find(
        r => r.name === roleNames[lang]
      );

      if (role) {
        const member = await guild.members.fetch(interaction.user.id);
        await member.roles.add(role).catch(() => {});
      }

      await interaction.reply({
        content: "✅ Language set! You now have access to your channel.",
        ephemeral: true
      });

      return;
    }

    // ================= SLASH COMMANDS =================
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "setup") {
      return setupCommand(interaction);
    }

    if (interaction.commandName === "uninstall") {
      return uninstallCommand(interaction);
    }

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
