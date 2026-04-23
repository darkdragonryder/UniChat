import { supabase } from "../services/supabase.js";

export default async function setupCommand(interaction) {
  await interaction.reply({
    content: "⚙️ Setting up UniChat...",
    ephemeral: true
  });

  const defaultChannel = interaction.channel;

  const languageMap = {
    ES: "🇪🇸",
    DE: "🇩🇪",
    IT: "🇮🇹",
    KO: "🇰🇷",
    RU: "🇷🇺"
  };

  const category = await interaction.guild.channels.create({
    name: "UniChat",
    type: 4
  });

  const enabled_channels = {};

  for (const [lang, emoji] of Object.entries(languageMap)) {
    const name = `${defaultChannel.name}-${emoji}`;

    const channel = await interaction.guild.channels.create({
      name,
      type: 0,
      parent: category.id
    });

    enabled_channels[lang] = channel.id;

    // Create role
    const roleName = lang;
    await interaction.guild.roles.create({ name: roleName });
  }

  await supabase.from("guild_settings").upsert({
    guild_id: interaction.guild.id,
    default_channel: defaultChannel.id,
    enabled_channels
  });

  await interaction.followUp({
    content: "✅ UniChat setup complete",
    ephemeral: true,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Dismiss",
            style: 4,
            custom_id: "dismiss"
          }
        ]
      }
    ]
  });
}
