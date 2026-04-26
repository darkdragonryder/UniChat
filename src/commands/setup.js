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
      content: "❌ Could not find #general channel",
      ephemeral: true
    });
  }

  // ===== CREATE CATEGORY =====
  const category = await guild.channels.create({
    name: "🌍 UniChat",
    type: 4
  });

  const enabled_channels = {};

  // ===== CREATE LANGUAGE CHANNELS =====
  for (const [lang, emoji] of Object.entries(languages)) {

    const channel = await guild.channels.create({
      name: `general-${emoji}`,
      type: 0,
      parent: category.id
    });

    enabled_channels[lang] = channel.id;
  }

  // ===== CREATE ONLY NON-ENGLISH ROLES =====
  const roleNames = [
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
      await guild.roles.create({
        name,
        mentionable: true
      });
    }
  }

  // ===== SAVE TO DB =====
  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    default_channel: defaultChannel.id,
    enabled_channels
  });

  // ===== FORCE CATEGORY POSITION AFTER CREATION =====
  setTimeout(async () => {
    try {
      const freshChannels = await guild.channels.fetch();

      const general = freshChannels.find(
        c => c.name === "general" && c.type === 0
      );

      const uniChat = freshChannels.find(
        c => c.name === "🌍 UniChat"
      );

      if (general && uniChat) {
        await uniChat.setPosition(general.position + 1);
      }
    } catch (err) {
      console.log("POSITION FIX ERROR:", err.message);
    }
  }, 2000);

  await interaction.followUp({
    content: "✅ Setup complete",
    ephemeral: true
  });
}
