import { supabase } from "../services/supabase.js";

export default async function addLanguageCommand(interaction) {
  try {

    const code = interaction.options.getString("code")?.trim().toUpperCase();
    const name = interaction.options.getString("name");
    const emoji = interaction.options.getString("emoji");

    if (!code || !name || !emoji) {
      return interaction.reply({
        content: "❌ Missing data",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels, base_channel_name")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels || {};
    const base = data?.base_channel_name || "chat";

    // ================= CATEGORY =================
    let category = guild.channels.cache.find(c =>
      c.name === "🌍 UniChat"
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: 4
      });
    }

    // ================= ROLE =================
    let role = guild.roles.cache.find(r =>
      r.name.toLowerCase() === name.toLowerCase()
    );

    if (!role) {
      role = await guild.roles.create({
        name,
        reason: "UniChat language role"
      });
    }

    // ================= CHANNEL =================
    const channel = await guild.channels.create({
      name: `${base}-${emoji}`,
      type: 0,
      parent: category.id
    });

    // ================= DB UPDATE =================
    channels[code] = channel.id;

    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      enabled_channels: channels,
      base_channel_name: base
    });

    return interaction.editReply(
      `✅ Added **${name} (${code})**\nChannel: ${channel}`
    );

  } catch (err) {
    console.log("ADD LANGUAGE ERROR:", err.message);

    return interaction.reply({
      content: "❌ Failed to add language",
      ephemeral: true
    });
  }
}
