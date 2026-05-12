import { EmbedBuilder } from "discord.js";

export default async function helpCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🌍 UniChat Help")
    .setDescription("Global translation system for Discord")
    .addFields(
      {
        name: "Setup",
        value: "`/setup` create system",
      },
      {
        name: "Language",
        value: "`/setlanguage` set your language",
      },
      {
        name: "How it works",
        value:
          "• You type normally\n• System translates automatically\n• Everyone sees their language",
      }
    );

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
