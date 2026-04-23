import { supabase } from "../services/supabase.js";

const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  KO: "🇰🇷",
  RU: "🇷🇺",
  JA: "🇯🇵"
};

export default async function setupCommand(interaction) {

  await interaction.reply({ content: "⚙️ Setting up...", ephemeral: true });

  const guild = interaction.guild;

  // ===== FIND EXISTING GENERAL CHANNEL =====
  const defaultChannel = guild.channels.cache.find(
    c => c.name === "general" && c.type === 0
  );

  if (!defaultChannel) {
    return interaction.followUp({
      content: "❌ No #general channel found",
      ephemeral: true
    });
  }

  // ===== CREATE CATEGORY =====
  const category = await guild.channels.create({
    name: "🌍 UniChat",
    type: 4
  });

  const enabled_channels = {};

  // ===== CREATE LANGUAGE CHANNELS (NO ENGLISH) =====
  for (const [lang, emoji] of Object.entries(languages)) {

    const channel = await guild.channels.create({
      name: `general-${emoji}`,
      type: 0,
      parent: category.id
    });

    enabled_channels[lang] = channel.id;
  }

  // ===== OPTIONAL ENGLISH ROLE ONLY =====
  const roleNames = [
    "English",
    "Spanish",
    "German",
    "Italian",
    "Korean",
    "Russian",
    "Japanese"
  ];

  for (const name of roleNames) {
    let role = guild.roles.cache.find(r => r.name === name);
    if (!role) {
      await guild.roles.create({ name });
    }
  }

  // ===== SAVE DB =====
  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    default_channel: defaultChannel.id,
    enabled_channels
  });

  await interaction.followUp({
    content: "✅ Setup complete (English uses existing #general)",
    ephemeral: true
  });
}
