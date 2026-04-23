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

console.log("🚀 UniChat STARTING");

client.once("ready", () => {
  console.log(`✅ ONLINE: ${client.user.tag}`);
});

// ================= JOIN =================
client.on("guildMemberAdd", async (member) => {
  try {
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", member.id)
      .maybeSingle();

    if (!data && member.guild.systemChannel) {
      await sendLanguagePrompt(member.guild.systemChannel, member.id);
    }
  } catch (err) {
    console.log("JOIN ERROR:", err.message);
  }
});

// ================= MESSAGE =================
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    if (!content || content.startsWith("/")) return;

    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user) {
      const sent = await sendLanguagePrompt(message.channel, message.author.id);

      // remove spam prompt after 30s
      setTimeout(() => {
        if (sent?.delete) sent.delete().catch(() => {});
      }, 30000);

      return;
    }

    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!data) return;

    const enabled = data.enabled_channels ?? {};
    const defaultChannel = data.default_channel;

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

    const sourceLang = user.language || "EN";

    for (const [channelId, targetLang] of channelMap.entries()) {

      if (channelId === message.channel.id) continue;
      if (targetLang === sourceLang) continue;

      const channel = channels.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, targetLang);

      if (!translated || translated === content) continue;

      await channel.send(`🌍 ${translated}`).catch(() => {});
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

      // remove old roles first (clean UX)
      for (const r of Object.values(roleMap)) {
        const role = guild.roles.cache.find(x => x.name === r);
        if (role && member.roles.cache.has(role.id)) {
          await member.roles.remove(role).catch(() => {});
        }
      }

      const newRole = guild.roles.cache.find(
        r => r.name === roleMap[lang]
      );

      if (newRole) {
        await member.roles.add(newRole).catch(() => {});
      }

      return interaction.reply({
        content: "✅ Language set successfully!",
        ephemeral: true
      });
    }

    // ================= COMMANDS =================
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

  } catch (err) {
    console.log("INTERACTION ERROR:", err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
