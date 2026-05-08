import { EmbedBuilder } from "discord.js";

export default async function announceOwner(interaction) {
  try {

    // 🔐 permission check FIRST
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ You are not allowed to use this.",
        ephemeral: true
      });
    }

    // ⏳ prevent timeout
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setAuthor({
        name: "UniChat Creator",
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTitle("🚀 Creator Announcement")
      .setDescription(
        "👑 The UniChat creator is active in this server.

" +
        "This is a verified UniChat instance."
      )
      .setFooter({ text: "UniChat • Verified Instance" })
      .setTimestamp();

    await interaction.channel.send({
      embeds: [embed],
      allowedMentions: { parse: [] }
    });

    return interaction.editReply("✅ Announcement sent");

  } catch (err) {
    console.log("ANNOUNCE OWNER ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: "❌ Failed to send announcement.",
        ephemeral: true
      });
    }
  }
}
