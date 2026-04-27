import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { supabase } from "../services/supabase.js";

const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  KO: "🇰🇷",
  RU: "🇷🇺",
  JA: "🇯🇵"
};

// ================= SAFE BOT ROLE =================
async function ensureBotRole(guild, client) {
  const botMember = await guild.members.fetch(client.user.id);

  let role = guild.roles.cache.find(r =>
    (r.name || "").toLowerCase().includes("bot")
  );

  if (!role) {
    role = await guild.roles.create({
      name: "🤖 UniChat Bot",
      color: 0x5865f2,
      reason: "UniChat bot role"
    });
  }

  await botMember.roles.add(role).catch(() => {});
  return role;
}

// ================= FINAL SETUP =================
export async function runFinalSetup(guild, client, selectedLangs, interaction) {

  await guild.channels.fetch();
  await guild.roles.fetch();

  // ================= BASE CHANNEL =================
  let baseChannel =
    interaction.channel?.name ||
    guild.systemChannel?.name ||
    "chat";

  baseChannel = baseChannel
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseChannel) baseChannel = "chat";

  // ================= CATEGORY =================
  const category = await guild.channels.create({
    name: "🌍 UniChat",
    type: 4,
    reason: "UniChat setup"
  });

  const enabled_channels = {};

  // ================= CREATE CHANNELS =================
  for (const lang of selectedLangs) {
    const channel = await guild.channels.create({
      name: `${baseChannel}-${languages[lang]}`,
      type: 0,
      parent: category.id,
      reason: "UniChat language channel"
    });

    enabled_channels[lang] = channel.id;
  }

  // ================= PICK DEFAULT CHANNEL SAFELY =================
  const firstChannelId = Object.values(enabled_channels).find(Boolean);

  // ================= SAVE DATABASE =================
  const { error } = await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    enabled_channels,
    base_channel_name: baseChannel,
    default_channel: firstChannelId,
    active_channel: firstChannelId,
    auto_translate: true
  });

  if (error) {
    console.log("❌ Supabase save error:", error.message);
  }

  // ================= ROLE SETUP =================
  for (const lang of selectedLangs) {
    const emoji = languages[lang];

    const roleName = Object.keys(languages).includes(lang)
      ? lang
      : null;

    const name = lang;

    if (!guild.roles.cache.find(r => r.name === name)) {
      await guild.roles.create({
        name,
        reason: "UniChat language role"
      }).catch(() => {});
    }
  }

  // ================= BOT ROLE =================
  await ensureBotRole(guild, client);

  console.log(`✅ UniChat setup complete for guild ${guild.id}`);
}

// ================= SETUP COMMAND =================
export default async function setupCommand(interaction) {

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🌐 UniChat Setup Wizard")
    .setDescription("Click below to begin setup.");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_start")
      .setLabel("Start Setup")
      .setStyle(ButtonStyle.Primary)
  );

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}
