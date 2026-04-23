import { supabase } from "../services/supabase.js";

const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  KO: "🇰🇷",
  RU: "🇷🇺"
};

export default async function setupCommand(interaction) {

  await interaction.reply({ content: "⚙️ Setting up UniChat...", ephemeral: true });

  const guild = interaction.guild;

  // ================= CREATE CATEGORY =================
  const category = await guild.channels.create({
    name: "🌍 UniChat",
    type: 4
  });

  // ================= POSITION UNDER GENERAL =================
  const general = guild.channels.cache.find(
    c => c.name === "general" && c.type === 0
  );

  if (general) {
    await category.setPosition(general.position + 1).catch(() => {});
  }

  // ================= CREATE LANGUAGE CHANNELS =================
  const enabled_channels = {};

  for (const [lang, emoji] of Object.entries(languages)) {

    const channel = await guild.channels.create({
      name: `general-${emoji}`,
      type: 0,
      parent: category.id
    });

    enabled_channels[lang] = channel.id;
  }

  // ================= SAVE TO DB =================
  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    default_channel: general?.id ?? null,
    enabled_channels
  });

  return interaction.followUp({
    content: "✅ UniChat setup complete",
    ephemeral: true
  });
}
