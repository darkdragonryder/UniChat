import { supabase } from "../services/supabase.js";
import { applyChannelLocks } from "../utils/applyChannelLocks.js";

const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  KO: "🇰🇷",
  RU: "🇷🇺",
  JA: "🇯🇵"
};

const roleNames = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian",
  JA: "Japanese"
};

export default async function setupCommand(interaction) {
  const guild = interaction.guild;

  // 🔥 IMPORTANT: prevents timeout + missing followup issues
  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply("⚙️ Setting up UniChat system...");

  // ================= FIND DEFAULT CHANNEL =================
  const defaultChannel = guild.channels.cache.find(
    c => c.name === "general" && c.type === 0
  );

  if (!defaultChannel) {
    return interaction.editReply("❌ #general not found");
  }

  // ================= CREATE CATEGORY =================
  const category = await guild.channels.create({
    name: "🌍 UniChat",
    type: 4
  });

  const enabled_channels = {};

  // ================= CREATE ROLES + CHANNELS =================
  for (const [lang, emoji] of Object.entries(languages)) {

    let role = guild.roles.cache.find(r => r.name === roleNames[lang]);

    if (!role) {
      role = await guild.roles.create({
        name: roleNames[lang],
        mentionable: false
      });
    }

    const channel = await guild.channels.create({
      name: `general-${emoji}`,
      type: 0,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: ["ViewChannel"]
        },
        {
          id: role.id,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
        }
      ]
    });

    enabled_channels[lang] = channel.id;
  }

  // ================= SAVE TO DATABASE =================
  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    default_channel: defaultChannel.id,
    enabled_channels
  });

  // ================= APPLY FINAL LOCKS =================
  await applyChannelLocks(guild, { enabled_channels });

  // ================= CATEGORY POSITION FIX =================
  setTimeout(async () => {
    try {
      const channels = await guild.channels.fetch();

      const general = channels.find(
        c => c.name === "general" && c.type === 0
      );

      const uniChat = channels.find(
        c => c.name === "🌍 UniChat" && c.type === 4
      );

      if (general && uniChat) {
        await uniChat.setPosition(general.position + 1);
      }

    } catch (err) {
      console.log("Category move error:", err.message);
    }
  }, 3000);

  // ================= FINAL MESSAGE =================
  return interaction.editReply("✅ UniChat setup complete");
}
