import { supabase } from "../services/supabase.js";

const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  KO: "🇰🇷",
  RU: "🇷🇺",
  JA: "🇯🇵"
};

function sanitize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function migrateCommand(interaction) {
  const guild = interaction.guild;

  await interaction.reply({
    content: "🔄 Starting UniChat migration...",
    ephemeral: true
  });

  try {
    await guild.channels.fetch();

    // ================= GET ACTIVE CHANNEL =================
    const { data } = await supabase
      .from("guild_settings")
      .select("active_channel, enabled_channels")
      .eq("guild_id", guild.id)
      .maybeSingle();

    let baseChannel = "general";

    const active = guild.channels.cache.get(data?.active_channel);

    if (active?.name) {
      baseChannel = sanitize(active.name);
    }

    const enabled = data?.enabled_channels || {};

    let renamed = 0;

    // ================= LOOP CHANNELS =================
    for (const [lang, channelId] of Object.entries(enabled)) {
      const channel = guild.channels.cache.get(channelId);

      if (!channel) continue;

      const emoji = languages[lang];
      if (!emoji) continue;

      const newName = `${baseChannel}-${emoji}`;

      if (channel.name !== newName) {
        await channel.setName(newName).catch(() => {});
        renamed++;
      }
    }

    return interaction.editReply(
      `✅ Migration complete. Renamed ${renamed} channels.`
    );

  } catch (err) {
    console.log("MIGRATION ERROR:", err.message);
    return interaction.editReply("❌ Migration failed.");
  }
}
