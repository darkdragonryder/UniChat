import { supabase } from "../services/supabase.js";
import { PermissionsBitField } from "discord.js";

export default async function setupCommand(interaction) {
  await interaction.reply({
    content: "🌍 Setting up **UniChat Global System...**",
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

  try {
    const general = interaction.guild.channels.cache.find(
      c => c.name === "general"
    );
    if (general) await category.setPosition(general.position + 1);
  } catch {}

  const enabled_channels = {};

  for (const [lang, data] of Object.entries(languageMap)) {

    const role = await interaction.guild.roles.create({
      name: data.name,
      reason: "UniChat language role"
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

  // ================= CLEAN FINAL MESSAGE =================
  const msg = await interaction.followUp({
    content:
      "✅ **UniChat is now active**\n\n" +
      "🌍 Automatic language detection enabled\n" +
      "🔄 Users are assigned roles automatically\n" +
      "💬 Only relevant language channels will be visible",
    ephemeral: true
  });

  // OPTIONAL: auto-clean message after 10 seconds (no button needed)
  setTimeout(() => {
    msg.delete().catch(() => {});
  }, 10000);
}
