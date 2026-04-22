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

  const enabled_channels = {};

  for (const [code, lang] of Object.entries(LANGUAGES)) {
    const channel = await guild.channels.create({
      name: `general-${lang.flag}`,
      type: ChannelType.GuildText,
      reason: "Phase 4 setup"
    });

    enabled_channels[code] = channel.id;

    console.log(`📁 Created: ${channel.name}`);
  }

  const { supabase } = await import("../services/supabase.js");

  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    enabled_channels
  });
}
