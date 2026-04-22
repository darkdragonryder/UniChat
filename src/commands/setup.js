import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} from "discord.js";

export default async function setupCommand(message) {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Admin only");
  }

  const channels = message.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText)
    .map(c => ({
      label: c.name,
      value: c.id
    }))
    .slice(0, 25);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("select_default_channel")
    .setPlaceholder("Select default English channel")
    .addOptions(channels);

  const row = new ActionRowBuilder().addComponents(menu);

  await message.reply({
    content: "📌 Choose your DEFAULT English channel:",
    components: [row]
  });
}
