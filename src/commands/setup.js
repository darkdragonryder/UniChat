import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} from "discord.js";

const LANGUAGES = {
  es: "Spanish",
  de: "German",
  it: "Italian",
  ko: "Korean"
};

export default async function setupCommand(message) {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Admin only");
  }

  const guild = message.guild;

  // ================= CHANNEL PICKER =================
  const channels = guild.channels.cache
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
    content: "📌 Select your DEFAULT English channel:",
    components: [row]
  });

  // ================= CREATE LANGUAGE ROLES =================
  for (const name of Object.values(LANGUAGES)) {
    const existing = guild.roles.cache.find(r => r.name === name);

    if (!existing) {
      await guild.roles.create({
        name,
        reason: "UniChat language setup"
      });

      console.log(`✅ Role created: ${name}`);
    }
  }
}
