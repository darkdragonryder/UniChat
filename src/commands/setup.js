import { supabase } from "../services/supabase.js";
import { applyChannelLocks } from "../utils/applyChannelLocks.js";

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

  const defaultChannel = guild.channels.cache.find(
    c => c.name === "general" && c.type === 0
  );

  if (!defaultChannel) {
    return interaction.followUp({
      content: "❌ #general not found",
      ephemeral: true
    });
  }

  const category = await guild.channels.create({
    name: "🌍 UniChat",
    type: 4
  });

  const enabled_channels = {};

  for (const [lang, emoji] of Object.entries(languages)) {

    let role = guild.roles.cache.find(r => r.name === roleNames[lang]);

    if (!role) {
      role = await guild.roles.create({
        name: roleNames[lang],
        mentionable: false
      });
    }

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

  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    default_channel: defaultChannel.id,
    enabled_channels
  });

  // 🔒 APPLY FINAL LOCKS (ensures consistency)
  await applyChannelLocks(guild, { enabled_channels });

  await interaction.followUp({
    content: "✅ UniChat setup complete + channels locked",
    ephemeral: true
  });
}
