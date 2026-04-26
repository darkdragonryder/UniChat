import { EmbedBuilder } from "discord.js";

export default async function announceOwner(interaction) {
  if (interaction.user.id !== process.env.OWNER_ID) {
    return interaction.reply({
      content: "❌ You are not allowed to use this.",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setAuthor({
      name: "UniChat Creator",
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTitle("🌏 Creator Announcement")
    .setDescription(
      "👑 The creator of UniChat is active in this server.\n\n" +
      "System is running at full capability."
    )
    .setFooter({ text: "UniChat • Verified Instance" });

  await interaction.channel.send({
    embeds: [embed],
    allowedMentions: { parse: [] }
  });

  await interaction.reply({
    content: "✅ Announcement sent",
    ephemeral: true
  });
}
