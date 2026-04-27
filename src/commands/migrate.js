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
  return (name || "chat")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function migrateCommand(interaction) {

  await interaction.reply("🔄 Migrating channels...");

  const { data } = await supabase
    .from("guild_settings")
    .select("active_channel, enabled_channels, base_channel_name")
    .eq("guild_id", interaction.guild.id)
    .maybeSingle();

  let base =
    data?.base_channel_name ||
    interaction.guild.channels.cache.get(data?.active_channel)?.name ||
    "chat";

  base = clean(base);

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
