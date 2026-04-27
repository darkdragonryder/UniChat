import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default async function infoCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🌐 UniChat – Clutterless Auto Translator")
    .setDescription(
      "Real-time translation so everyone reads messages in their own language.\n\n" +
      "• In-channel translations\n" +
      "• Reaction translate 🌐\n" +
      "• Multi-language support\n" +
      "• Clean, clutterless design"
    )
    .setFooter({ text: "UniChat • Global communication made simple" });

  const inviteButton = new ButtonBuilder()
    .setLabel("🚀 Invite UniChat")
    .setStyle(ButtonStyle.Link)
    .setURL("https://discord.com/oauth2/authorize?client_id=1493079688904704180&permissions=378762546288&scope=bot+applications.commands");

  const row = new ActionRowBuilder().addComponents(inviteButton);

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}
