import { EmbedBuilder } from "discord.js";

export default async function announceOwner(interaction) {
  try {

    // 🔐 permission check first
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ You are not allowed to use this.",
        ephemeral: true
      });
    }

    // ⏳ prevent "application did not respond"
    await interaction.deferReply({ ephemeral: true });

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

    // 📢 send to channel
    await interaction.channel.send({
      embeds: [embed],
      allowedMentions: { parse: [] }
    });

    // ✅ respond to interaction safely
    return interaction.editReply("✅ Announcement sent");

  } catch (err) {
    console.log("ANNOUNCE ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: "❌ Failed to send announcement.",
        ephemeral: true
      });
    }
  }
}
