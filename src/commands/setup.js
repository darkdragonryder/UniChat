import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} from "discord.js";

const LANGUAGES = {
  es: { name: "Spanish", flag: "🇪🇸" },
  de: { name: "German", flag: "🇩🇪" },
  it: { name: "Italian", flag: "🇮🇹" },
  ko: { name: "Korean", flag: "🇰🇷" }
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
    .setPlaceholder("Select DEFAULT English channel")
    .addOptions(channels);

  const row = new ActionRowBuilder().addComponents(menu);

  await message.reply({
    content: "📌 Select DEFAULT English channel:",
    components: [row]
  });

  // ================= CREATE LANGUAGE CHANNELS =================
  const enabled_channels = {};

  for (const [code, lang] of Object.entries(LANGUAGES)) {
    const channelName = `general-${lang.flag}`;

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      reason: "UniChat Phase 3 setup"
    });

    enabled_channels[code] = channel.id;

    console.log(`📁 Channel created: ${channelName}`);
  }

  // ================= SAVE TO DATABASE =================
  const { supabase } = await import("../services/supabase.js");

  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    enabled_channels
  });

  console.log("💾 Setup saved successfully");
}
