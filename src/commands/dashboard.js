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

  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    enabled_channels
  });

  await interaction.followUp({
    content: "✅ Setup complete",
    ephemeral: true
  });
}
