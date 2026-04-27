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

async function ensureBotRole(guild, client) {
  const botMember = await guild.members.fetch(client.user.id);

  let role = guild.roles.cache.find(r =>
    (r.name || "").toLowerCase().includes("bot")
  );

  if (!role) {
    role = await guild.roles.create({
      name: "🤖 UniChat Bot",
      color: 0x5865f2,
      reason: "UniChat role"
    });
  }

  await botMember.roles.add(role).catch(() => {});
  return role;
}

export async function runFinalSetup(guild, client, selectedLangs, interaction) {

  await guild.channels.fetch();
  await guild.roles.fetch();

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

  // ================= CREATE CHANNELS =================
  for (const lang of selectedLangs) {
    const channel = await guild.channels.create({
      name: `${baseChannel}-${languages[lang]}`,
      type: 0,
      parent: category.id
    });

    enabled_channels[lang] = channel.id;
  }

  const firstChannelId = Object.values(enabled_channels)[0];

  // ================= SAVE DB (CRITICAL FIX) =================
  const { error } = await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    enabled_channels,
    default_channel: firstChannelId,
    active_channel: firstChannelId
  });

  if (error) {
    console.log("❌ DB ERROR:", error.message);
  }

  await ensureBotRole(guild, client);

  console.log("✅ Setup complete for", guild.id);
}

export default async function setupCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🌐 UniChat Setup")
    .setDescription("Click below to start setup");

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
