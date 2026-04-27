import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default async function setupWizard(interaction) {

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("⚙️ UniChat Setup Wizard")
    .setDescription(
      "This will guide you through setting up UniChat.\n\n" +
      "Step-by-step configuration for language channels + roles."
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_start")
      .setLabel("Start Setup")
      .setStyle(ButtonStyle.Primary)
  );

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}
