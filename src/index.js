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

export async function runFinalSetup(guild, client, selectedLangs, interaction) {

  try {

    await guild.channels.fetch();
    await guild.roles.fetch();

    let baseChannel =
      interaction.channel?.name || "chat";

    baseChannel = baseChannel
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const category = await guild.channels.create({
      name: "🌍 UniChat",
      type: 4
    });

    const enabled_channels = {};

    for (const lang of selectedLangs) {
      const channel = await guild.channels.create({
        name: `${baseChannel}-${languages[lang]}`,
        type: 0,
        parent: category.id
      });

      enabled_channels[lang] = channel.id;
    }

    const firstChannelId = Object.values(enabled_channels)[0];

    // 🔥 SELF-HEAL SAVE
    const { error } = await supabase
      .from("guild_settings")
      .upsert({
        guild_id: guild.id,
        enabled_channels,
        default_channel: firstChannelId,
        active_channel: firstChannelId
      });

    if (error) {
      console.log("❌ DB ERROR:", error.message);
    }

    console.log("✅ Setup complete:", guild.id);

  } catch (err) {
    console.log("SETUP CRASH:", err.message);
  }
}

export default async function setupCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🌐 UniChat Setup");

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
