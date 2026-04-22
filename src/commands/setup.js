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
    content: "📌 Select DEFAULT English channel:",
    components: [row]
  });

  // ================= CREATE LANGUAGE CHANNELS =================
  const enabled_channels = {};

  for (const [code, name] of Object.entries(LANGUAGES)) {
    const channel = await guild.channels.create({
      name: `chat-${code}`,
      type: 0,
      reason: "UniChat mirror system setup"
    });

    enabled_channels[code] = channel.id;

    console.log(`📁 Channel created: ${channel.name}`);
  }

  // ================= SAVE CHANNELS =================
  await require("../services/supabase.js").supabase
    .from("guild_settings")
    .upsert({
      guild_id: guild.id,
      enabled_channels
    });
}
