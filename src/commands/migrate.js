import { supabase } from "../services/supabase.js";

const emojis = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  KO: "🇰🇷",
  RU: "🇷🇺",
  JA: "🇯🇵"
};

function clean(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export default async function migrateCommand(interaction) {

  await interaction.reply("🔄 Migrating channels...");

  const { data } = await supabase
    .from("guild_settings")
    .select("active_channel, enabled_channels")
    .eq("guild_id", interaction.guild.id)
    .maybeSingle();

  const base = clean(
    interaction.guild.channels.cache.get(data?.active_channel)?.name || "general"
  );

  let count = 0;

  for (const [lang, id] of Object.entries(data?.enabled_channels || {})) {

    const channel = interaction.guild.channels.cache.get(id);
    if (!channel) continue;

    const newName = `${base}-${emojis[lang]}`;

    if (channel.name !== newName) {
      await channel.setName(newName).catch(() => {});
      count++;
    }
  }

  return interaction.editReply(`✅ Migrated ${count} channels`);
}
