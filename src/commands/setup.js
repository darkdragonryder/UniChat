import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField
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

  const statusMsg = await message.reply("⚙️ Starting UniChat setup...");

  // ================= DROPDOWN =================
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

  const menuMsg = await message.channel.send({
    content: "📌 Select your DEFAULT English channel:",
    components: [row]
  });

  // ================= CATEGORY =================
  let category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === ChannelType.GuildCategory
  );

  if (!category) {
    category = await guild.channels.create({
      name: "🌍 UniChat",
      type: ChannelType.GuildCategory
    });
  }

  await category.setPosition(1);

  // ================= ROLES =================
  await statusMsg.edit("🔧 Creating roles...");

  const roleMap = {};

  for (const lang of Object.values(LANGUAGES)) {
    let role = guild.roles.cache.find(r => r.name === lang.name);

    if (!role) {
      role = await guild.roles.create({
        name: lang.name
      });
    }

    roleMap[lang.name] = role;
  }

  // ================= CHANNELS =================
  await statusMsg.edit("📁 Creating / syncing channels...");

  const enabled_channels = {};

  for (const [code, lang] of Object.entries(LANGUAGES)) {
    const name = `general-${lang.flag}`;
    const role = roleMap[lang.name];

    let channel = guild.channels.cache.find(c => c.name === name);

    if (!channel) {
      channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category.id
      });
    } else {
      if (channel.parentId !== category.id) {
        await channel.setParent(category.id);
      }
    }

    // 🔒 PERMISSIONS (ONLY ROLE CAN SEE)
    await channel.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: role.id,
        allow: [PermissionsBitField.Flags.ViewChannel]
      }
    ]);

    enabled_channels[code] = channel.id;
  }

  // ================= SAVE =================
  const { supabase } = await import("../services/supabase.js");

  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    enabled_channels
  });

  // ================= CLEANUP =================
  setTimeout(async () => {
    try {
      await message.delete();
      await menuMsg.delete();
    } catch {}
  }, 5000);

  // ================= FINAL =================
  const embed = new EmbedBuilder()
    .setTitle("✅ UniChat Setup Complete")
    .setDescription("Channels locked + system active.")
    .setColor("Green");

  await statusMsg.edit({ content: "", embeds: [embed] });
}
