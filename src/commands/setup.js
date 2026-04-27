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

const roleNames = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian",
  JA: "Japanese"
};

// ================= BOT ROLE =================
async function ensureBotRole(guild, client) {
  const botMember = await guild.members.fetch(client.user.id);

  let role = guild.roles.cache.find(r =>
    ["bot", "bots", "unichat"].some(k =>
      r.name.toLowerCase().includes(k)
    )
  );

  if (!role) {
    role = await guild.roles.create({
      name: "🤖 UniChat Bot",
      color: 0x5865f2,
      mentionable: false,
      reason: "Auto bot role"
    });
  }

  await botMember.roles.add(role).catch(() => {});
  return role;
}

// ================= FINAL SETUP =================
export async function runFinalSetup(guild, client, selectedLangs, interaction) {

  await guild.channels.fetch();
  await guild.roles.fetch();

  // ================= SAFE BASE CHANNEL DETECTION =================
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
    type: 4
  });

  const enabled_channels = {};

  // ================= CHANNEL CREATION =================
  for (const lang of selectedLangs) {
    const emoji = languages[lang];

    const channel = await guild.channels.create({
      name: `${baseChannel}-${emoji}`,
      type: 0,
      parent: category.id
    });

    enabled_channels[lang] = channel.id;
  }

  // ================= SAVE DB (FIXED STRUCTURE) =================
  const firstChannelId = Object.values(enabled_channels)[0];

  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,

    // CORE SYSTEM
    enabled_channels,
    base_channel_name: baseChannel,

    // 🔥 FIXED (IMPORTANT FOR YOUR TRANSLATION ENGINE)
    default_channel: firstChannelId,
    active_channel: firstChannelId
  });

  // ================= LANGUAGE ROLES =================
  for (const lang of selectedLangs) {
    const name = roleNames[lang];

    if (!guild.roles.cache.find(r => r.name === name)) {
      await guild.roles.create({
        name,
        mentionable: false,
        reason: "UniChat language role"
      });
    }
  }

  // ================= OWNER ROLE =================
  let ownerRole = guild.roles.cache.find(r => r.name === "🌏 UniChat Owner");

  if (!ownerRole) {
    ownerRole = await guild.roles.create({
      name: "🌏 UniChat Owner",
      color: 0x00bfff,
      mentionable: false,
      reason: "Owner role"
    });
  }

  // ================= BOT ROLE =================
  const botRole = await ensureBotRole(guild, client);
  const botMember = await guild.members.fetch(client.user.id);

  let pos = botMember.roles.highest.position - 1;

  await ownerRole.setPosition(pos--).catch(() => {});
  await botRole.setPosition(pos--).catch(() => {});
}

// ================= WIZARD ENTRY =================
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
