import { EmbedBuilder } from "discord.js";

export default async function helpCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🌍 UniChat Help")
    .setDescription("Your global chat system — no language barriers.")
    .addFields(
      {
        name: "⚙️ Setup",
        value: "`/setup` → Create UniChat system (channels, roles, config)",
        inline: false
      },
      {
        name: "🗑️ Uninstall",
        value: "`/uninstall` → Remove everything UniChat created",
        inline: false
      },
      {
        name: "🌐 Language",
        value: "`/setlanguage` → Set your personal language",
        inline: false
      },
      {
        name: "💬 How It Works",
        value:
          "• You type in your language
" +
          "• UniChat translates automatically
" +
          "• Messages appear in all other language channels
" +
          "• Everyone reads in their own language",
        inline: false
      },
      {
        name: "🧠 Tips",
        value:
          "• Set your language first
" +
          "• Use the correct channel for best results
" +
          "• Short messages translate faster",
        inline: false
      }
    )
    .setFooter({ text: "UniChat • Global communication made simple" });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
