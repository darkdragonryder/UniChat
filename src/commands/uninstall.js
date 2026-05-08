import { db } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {

  await interaction.reply({
    content: "🧹 Starting safe UniChat uninstall...",
    ephemeral: true
  });

  const guild = interaction.guild;

  try {
    const supabase = db();

    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (!data) {
      return interaction.editReply("❌ No UniChat setup found.");
    }

    const channels = data.enabled_channels || {};

    const roleNames = [
      "Spanish",
      "German",
      "Italian",
      "Japanese",
      "Korean",
      "Russian",
      "🤖 UniChat Bot"
    ];

    for (const role of guild.roles.cache.values()) {
      if (roleNames.includes(role.name)) {
        await role.delete("UniChat uninstall").catch(() => {});
      }
    }

    for (const [lang, channelId] of Object.entries(channels)) {
      if (channelId === data.default_channel) continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      await channel.delete("UniChat uninstall cleanup").catch(() => {});
    }

    const category = guild.channels.cache.find(c => c.name === "🌍 UniChat");

    if (category) {
      await category.delete("UniChat uninstall").catch(() => {});
    }

    await supabase
      .from("guild_settings")
      .delete()
      .eq("guild_id", guild.id);

    return interaction.editReply("✅ UniChat safely uninstalled.");

  } catch (err) {
    console.log("UNINSTALL ERROR:", err);
    return interaction.editReply("❌ Uninstall failed safely.");
  }
}
