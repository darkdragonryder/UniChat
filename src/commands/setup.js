import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} from "discord.js";

const LANGUAGES = {
  es: { name: "Spanish", flag: "🇪🇸" },
  de: { name: "German", flag: "🇩🇪" },
  it: { name: "Italian", flag: "🇮🇹" },
  ko: { name: "Korean", flag: "🇰🇷" },
  ru: { name: "Russian", flag: "🇷🇺" }
};

export default async function setupCommand(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Admin only", ephemeral: true });
  }

  await interaction.reply({
    content: "⚙️ Setting up UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  // ================= DEFAULT CHANNEL SELECT =================
  const channels = guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText)
    .map(c => ({
      label: c.name,
      value: c.id
    }))
    .slice(0, 25);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("select_default_channel")
    .setPlaceholder("Select default channel")
    .addOptions(channels);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.followUp({
    content: "📌 Choose default channel:",
    components: [row],
    ephemeral: true
  });

  // NOTE: your existing setup logic continues (roles, channels, category, DB)
}
