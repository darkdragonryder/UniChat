import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  EmbedBuilder
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

  // ================= STEP MESSAGE =================
  const statusMsg = await message.reply("⚙️ Starting UniChat setup...");

  // ================= CHANNEL SELECT =================
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

  await message.channel.send({
    content: "📌 Select your DEFAULT English channel:",
    components: [row]
  });

  // ================= CREATE CATEGORY =================
  let category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === ChannelType.GuildCategory
  );

  if (!category) {
    category = await guild.channels.create({
      name: "🌍 UniChat",
      type: ChannelType.GuildCategory
    });
  }

  // ================= CREATE ROLES =================
  await statusMsg.edit("🔧 Creating roles...");

  for (const lang of Object.values(LANGUAGES)) {
    let role = guild.roles.cache.find(r => r.name === lang.name);

    if (!role) {
      role = await guild.roles.create({
        name: lang.name,
        reason: "UniChat setup"
      });
    }
  }

  // ================= CREATE CHANNELS =================
  await statusMsg.edit("📁 Creating language channels...");

  const enabled_channels = {};

  for (const [code, lang] of Object.entries(LANGUAGES)) {
    const name = `general-${lang.flag}`;

    let channel = guild.channels.cache.find(c => c.name === name);

    if (!channel) {
      channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category.id
      });
    }

    enabled_channels[code] = channel.id;
  }

  // ================= SAVE =================
  const { supabase } = await import("../services/supabase.js");

  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    enabled_channels
  });

  // ================= FINAL EMBED =================
  const embed = new EmbedBuilder()
    .setTitle("✅ UniChat Setup Complete")
    .setDescription("Your translation system is now active.")
    .addFields(
      { name: "🌍 Languages", value: Object.values(LANGUAGES).map(l => l.name).join(", ") },
      { name: "📁 Channels", value: "Created and organised under 🌍 UniChat" },
      { name: "⚙️ Status", value: "Ready" }
    )
    .setColor("Green");

  await statusMsg.edit({ content: "", embeds: [embed] });
}
