import { supabase } from "../services/supabase.js";

const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  JA: "🇯🇵",
  KO: "🇰🇷"
};

export default async function setupCommand(interaction, client) {

  await interaction.reply({
    content: "⚙️ Setting up UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  try {
    await guild.channels.fetch();

    // ================= BASE NAME =================
    let base =
      interaction.channel?.name ||
      guild.systemChannel?.name ||
      "chat";

    base = base
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!base) base = "chat";

    // ================= CATEGORY =================
    const category = await guild.channels.create({
      name: "🌍 UniChat",
      type: 4
    });

    const enabled_channels = {};

    // ================= CREATE CHANNELS =================
    for (const [lang, emoji] of Object.entries(languages)) {
      const channel = await guild.channels.create({
        name: `${base}-${emoji}`,
        type: 0,
        parent: category.id
      });

      enabled_channels[lang] = channel.id;
    }

    const firstChannelId = Object.values(enabled_channels)[0];

    // ================= SAVE DATABASE =================
    const { error } = await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      enabled_channels,
      default_channel: firstChannelId,
      active_channel: firstChannelId
    });

    if (error) {
      console.log("DB ERROR:", error.message);
      return interaction.editReply("❌ Failed to save setup.");
    }

    // ================= DONE =================
    return interaction.editReply("✅ UniChat setup complete!");

  } catch (err) {
    console.log("SETUP ERROR:", err.message);
    return interaction.editReply("❌ Setup failed.");
  }
}
