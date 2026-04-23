import { supabase } from "../services/supabase.js";
import { PermissionsBitField } from "discord.js";

export default async function setupCommand(interaction) {

  const { data: existing } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", interaction.guild.id)
    .single();

  if (existing) {
    return interaction.reply({
      content: "⚠️ UniChat already installed. Run `/uninstall` first.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content: "🌍 Setting up UniChat...",
    ephemeral: true
  });

  const base = interaction.channel;

  const languageMap = {
    ES: { emoji: "🇪🇸", name: "Spanish" },
    DE: { emoji: "🇩🇪", name: "German" },
    IT: { emoji: "🇮🇹", name: "Italian" },
    KO: { emoji: "🇰🇷", name: "Korean" },
    RU: { emoji: "🇷🇺", name: "Russian" }
  };

  const category = await interaction.guild.channels.create({
    name: "🌍 UniChat",
    type: 4
  });

  const enabled_channels = {};

  for (const [lang, data] of Object.entries(languageMap)) {

    const role = await interaction.guild.roles.create({
      name: data.name,
      reason: "UniChat role"
    });

    const channel = await interaction.guild.channels.create({
      name: `general-${data.emoji}`,
      type: 0,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: role.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    enabled_channels[lang] = channel.id;
  }

  await supabase.from("guild_settings").upsert({
    guild_id: interaction.guild.id,
    default_channel: base.id,
    enabled_channels
  });

  return interaction.followUp({
    content: "✅ UniChat setup complete.",
    ephemeral: true
  });
}
