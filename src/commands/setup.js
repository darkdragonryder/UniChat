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
      mentionable: false
    });
  }

  await botMember.roles.add(role).catch(() => {});
  return role;
}

export async function runFinalSetup(guild, client, selectedLangs, interaction) {

  await guild.channels.fetch();
  await guild.roles.fetch();

  // ================= BASE CHANNEL =================
  let baseChannel = interaction.channel?.name || "chat";

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

  for (const lang of selectedLangs) {
    const emoji = languages[lang];

    const channel = await guild.channels.create({
      name: `${baseChannel}-${emoji}`,
      type: 0,
      parent: category.id
    });

    enabled_channels[lang] = channel.id;
  }

  // ================= DB FIX (IMPORTANT) =================
  await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    enabled_channels,
    base_channel_name: baseChannel,

    // 🔥 PRIMARY SOURCE
    default_channel: interaction.channelId,

    // 📊 TRACKING
    active_channel: interaction.channelId
  });

  for (const lang of selectedLangs) {
    const name = roleNames[lang];
    if (!guild.roles.cache.find(r => r.name === name)) {
      await guild.roles.create({ name });
    }
  }

  let ownerRole = guild.roles.cache.find(r => r.name === "🌏 UniChat Owner");

  if (!ownerRole) {
    ownerRole = await guild.roles.create({
      name: "🌏 UniChat Owner",
      color: 0x00bfff
    });
  }

  const botRole = await ensureBotRole(guild, client);
  const botMember = await guild.members.fetch(client.user.id);

  let pos = botMember.roles.highest.position - 1;

  await ownerRole.setPosition(pos--).catch(() => {});
  await botRole.setPosition(pos--).catch(() => {});
}

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
