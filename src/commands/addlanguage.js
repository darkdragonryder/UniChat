import { supabase } from "../services/supabase.js";

export default async function addLanguageCommand(interaction) {
  try {

    const code = interaction.options.getString("code");   // e.g. FR
    const name = interaction.options.getString("name");   // e.g. French
    const emoji = interaction.options.getString("emoji"); // e.g. 🇫🇷

    if (!code || !name || !emoji) {
      return interaction.reply({
        content: "❌ Missing code, name or emoji.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    // ================= FETCH SETTINGS =================
    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels, base_channel_name")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels || {};

    // ================= CATEGORY =================
    let category = guild.channels.cache.find(
      c => c.name === "🌍 UniChat"
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: 4
      });
    }

    // ================= BASE NAME =================
    const base = data?.base_channel_name || "chat";

    // ================= CREATE ROLE =================
    let role = guild.roles.cache.find(r =>
      r.name.toLowerCase() === name.toLowerCase()
    );

    if (!role) {
      role = await guild.roles.create({
        name,
        mentionable: false,
        reason: "UniChat dynamic language role"
      });
    }

    // ================= CREATE CHANNEL =================
    const channel = await guild.channels.create({
      name: `${base}-${emoji}`,
      type: 0,
      parent: category.id
    });

    // ================= UPDATE DATABASE (SAFE MERGE) =================
    channels[code.toUpperCase()] = channel.id;

    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      enabled_channels: channels,
      base_channel_name: base
    });

    // ================= SUCCESS =================
    return interaction.editReply(
      `✅ Added language **${name} (${code})** successfully!\nChannel: ${channel}`
    );

  } catch (err) {
    console.log("ADD LANGUAGE ERROR:", err.message);

    return interaction.reply({
      content: "❌ Failed to add language.",
      ephemeral: true
    });
  }
}
