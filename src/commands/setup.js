import { supabase } from "../services/supabase.js";

const languages = {
  EN: { name: "English", emoji: "🇬🇧" },
  ES: { name: "Spanish", emoji: "🇪🇸" },
  DE: { name: "German", emoji: "🇩🇪" },
  IT: { name: "Italian", emoji: "🇮🇹" },
  KO: { name: "Korean", emoji: "🇰🇷" },
  RU: { name: "Russian", emoji: "🇷🇺" },
  JA: { name: "Japanese", emoji: "🇯🇵" }
};

export default async function setupCommand(interaction) {

  await interaction.reply({
    content: "⚙️ Setting up UniChat (roles + channels)...",
    ephemeral: true
  });

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

  // ================= CREATE ROLES =================
  const roleMap = {};

  for (const [code, data] of Object.entries(languages)) {

    let role = guild.roles.cache.find(r => r.name === data.name);

    if (!role) {
      role = await guild.roles.create({
        name: data.name,
        mentionable: true
      });
    }

    roleMap[code] = role;
  }

  // ================= CREATE CHANNELS =================
  const enabled_channels = {};

  for (const [code, data] of Object.entries(languages)) {

    const channelName =
      code === "EN" ? "general" : `general-${data.emoji}`;

    const channel = await guild.channels.create({
      name: channelName,
      type: 0,
      parent: category.id
    });

    enabled_channels[code] = channel.id;

    // ================= PERMISSIONS =================
    const overwrites = [];

    // hide from everyone
    overwrites.push({
      id: guild.roles.everyone.id,
      deny: ["ViewChannel"]
    });

    // allow correct role
    overwrites.push({
      id: roleMap[code].id,
      allow: ["ViewChannel", "SendMessages"]
    });

    await channel.permissionOverwrites.set(overwrites);
  }

  // ================= SAVE DB =================
  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    default_channel: enabled_channels["EN"],
    enabled_channels
  });

  return interaction.followUp({
    content: "✅ UniChat fully setup (roles + channels + Japanese added)",
    ephemeral: true
  });
}
