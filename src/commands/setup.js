import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder
} from "discord.js";

export default async function setupCommand(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Admin only", ephemeral: true });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_use_current")
      .setLabel("Use current channel")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("setup_pick_channel")
      .setLabel("Pick channel")
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    content: "⚙️ UniChat Setup\nChoose how to set default channel:",
    components: [row],
    ephemeral: true
  });
}
