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
  const guild = interaction.guild;

  await interaction.reply({ content: "⚙️ Setting up UniChat...", ephemeral: true });

  await guild.channels.fetch();

  const category = await guild.channels.create({
    name: "🌍 UniChat",
    type: 4
  });

  const enabled_channels = {};

  for (const [lang, emoji] of Object.entries(languages)) {
    const channel = await guild.channels.create({
      name: `general-${emoji}`,
      type: 0,
      parent: category.id
    });

    enabled_channels[lang] = channel.id;
  }

  const default_channel = interaction.channel.id;

  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    default_channel,
    enabled_channels
  });

  for (const name of Object.values(roleNames)) {
    if (!guild.roles.cache.find(r => r.name === name)) {
      await guild.roles.create({ name });
    }
  }

  return interaction.editReply("✅ Setup complete");
}
