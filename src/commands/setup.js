import { ChannelType, EmbedBuilder } from "discord.js";

export default async function uninstallCommand(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Admin only", ephemeral: true });
  }

  await interaction.reply({
    content: "🧹 Removing UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  const category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === ChannelType.GuildCategory
  );

  if (category) await category.delete().catch(() => {});

  const { supabase } = await import("../services/supabase.js");

  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  await interaction.followUp({
    embeds: [
      new EmbedBuilder()
        .setTitle("✅ UniChat Removed")
        .setColor("Red")
    ],
    ephemeral: true
  });
}
