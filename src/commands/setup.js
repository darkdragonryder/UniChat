import { supabase } from "../services/supabase.js";

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

  await interaction.reply({ content: "⚙️ Setting up UniChat...", ephemeral: true });

  const guild = interaction.guild;

  // ================= FIND GENERAL =================
  const defaultChannel = guild.channels.cache.find(
    c => c.name === "general" && c.type === 0
  );

  if (!defaultChannel) {
    return interaction.followUp({
      content: "❌ #general channel not found",
      ephemeral: true
    });
  }

  // ================= CREATE CATEGORY =================
  const category = await guild.channels.create({
    name: "🌍 UniChat",
    type: 4
  });

  // ================= FIX CATEGORY POSITION =================
  setTimeout(async () => {
    try {
      const fresh = await guild.channels.fetch();

      const general = fresh.find(
        c => c.name === "general" && c.type === 0
      );

      const uniChat = fresh.find(
        c => c.name === "🌍 UniChat"
      );

      if (general && uniChat) {
        await uniChat.setPosition(general.position + 1);
      }
    } catch (err) {
      console.log("Category position error:", err.message);
    }
  }, 2000);

  const enabled_channels = {};

  // ================= CREATE ROLES + CHANNELS =================
  for (const [lang, emoji] of Object.entries(languages)) {

    // ---- ROLE ----
    let role = guild.roles.cache.find(r => r.name === roleNames[lang]);

    if (!role) {
      role = await guild.roles.create({
        name: roleNames[lang],
        mentionable: false
      });
    }

    // ---- CHANNEL WITH LOCKED PERMISSIONS ----
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

  await interaction.followUp({
    content: "✅ UniChat setup complete (locked channels enabled)",
    ephemeral: true
  });
}
