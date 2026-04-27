import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default async function infoCommand(interaction, client) {

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🌐 UniChat Dashboard")
    .setDescription(
      "Clutterless Auto Translator System\n\n" +
      "Live bot overview and controls."
    )
    .addFields(
      {
        name: "📊 Servers",
        value: `${client.guilds.cache.size}`,
        inline: true
      },
      {
        name: "👥 Users",
        value: `${client.users.cache.size}`,
        inline: true
      },
      {
        name: "⚡ Status",
        value: "Online & Translating",
        inline: false
      }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("🚀 Invite")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com/oauth2/authorize?client_id=1493079688904704180&permissions=378762546288&scope=bot+applications.commands")
  );

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}
