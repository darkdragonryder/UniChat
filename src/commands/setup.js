import { supabase } from "../services/supabase.js";
import { PermissionsBitField } from "discord.js";

export default async function setupCommand(interaction) {
  await interaction.reply({
    content: "⚙️ Setting up UniChat...",
    ephemeral: true
  });

  const base = interaction.channel;

  // ================= LANGUAGE CONFIG =================
  const languageMap = {
    ES: { emoji: "🇪🇸", name: "Spanish" },
    DE: { emoji: "🇩🇪", name: "German" },
    IT: { emoji: "🇮🇹", name: "Italian" },
    KO: { emoji: "🇰🇷", name: "Korean" },
    RU: { emoji: "🇷🇺", name: "Russian" }
  };

  // ================= CATEGORY =================
  const category = await interaction.guild.channels.create({
    name: "UniChat",
    type: 4,
    position: 1
  });

  const enabled_channels = {};

  // ================= ROLE + CHANNEL SETUP =================
  for (const [lang, data] of Object.entries(languageMap)) {

    // Create role (used for visibility only)
    const role = await interaction.guild.roles.create({
      name: data.name,
      reason: "UniChat language role"
    });

    // Create locked channel (ROLE-BASED ONLY)
    const channel = await interaction.guild.channels.create({
      name: `${base.name}-${data.emoji}`,
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

  // ================= SAVE TO DATABASE =================
  await supabase.from("guild_settings").upsert({
    guild_id: interaction.guild.id,
    default_channel: base.id,
    enabled_channels
  });

  // ================= CLEAN RESPONSE =================
  await interaction.followUp({
    content: "✅ UniChat setup complete\n\nUsers will now only see #general + their language channel.",
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
