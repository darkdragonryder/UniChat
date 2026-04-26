import { EmbedBuilder } from "discord.js";

export default async function infoCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00ff99)
    .setTitle("🌍 UniChat Info")
    .addFields(
      {
        name: "📦 Version",
        value: "1.0 (Stable)",
        inline: true
      },
      {
        name: "⚡ Status",
        value: "Online & Running",
        inline: true
      },
      {
        name: "🌐 System",
        value: "Multi-language chat engine",
        inline: true
      },
      {
        name: "🧠 What UniChat Does",
        value:
          "Real-time multilingual communication system that translates messages across dedicated language channels.",
        inline: false
      },
      {
        name: "⚙️ Features",
        value:
          "• Automatic translation\n" +
          "• Multi-channel sync\n" +
          "• Smart caching (faster + cheaper)\n" +
          "• Role-based channel visibility\n" +
          "• Safe messaging (no unwanted pings)",
        inline: false
      },
      {
        name: "🔄 How It Works",
        value:
          "1. User sends message\n" +
          "2. Language is identified\n" +
          "3. Message is translated\n" +
          "4. Sent to all other language channels",
        inline: false
      }
    )
    .setFooter({ text: "UniChat • Built for global communities" });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
