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

    // ================= EN SAFETY (BASE LANGUAGE) =================
    if (code === "EN") {
      return interaction.editReply("❌ EN is the base language and cannot be added.");
    }

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels, base_channel_name")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels || {};
    const base = data?.base_channel_name || "chat";

    // ================= DUPLICATE CHECK =================
    if (channels[code]) {
      return interaction.editReply(`❌ Language **${code}** already exists.`);
    }

    // ================= CATEGORY =================
    let category = guild.channels.cache.find(c =>
      c.name === "🌍 UniChat"
    );

    if (!category || category.deleted) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: 4
      });
    }

    // ================= ROLE =================
    let role = guild.roles.cache.find(r =>
      r.name === `UniChat-${code}`
    );

    if (!role) {
      role = await guild.roles.create({
        name: `UniChat-${code}`,
        reason: "UniChat language role"
      });
    }

    // ================= CHANNEL =================
    const channel = await guild.channels.create({
      name: base, // 🔥 KEEP YOUR DESIGN (no emoji changes)
      type: 0,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: ["ViewChannel"]
        },
        {
          id: role.id,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
        }
      ]
    });

    // ================= UPDATE SUPABASE =================
    channels[code] = channel.id;

    const { error } = await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      enabled_channels: channels,
      base_channel_name: base
    });

    if (error) {
      console.log("ADD LANGUAGE DB ERROR:", error);
      return interaction.editReply("❌ Failed to save language to database.");
    }

    return interaction.editReply(
      `✅ Added **${name} (${code})**\n📍 Channel: ${channel}`
    );

  } catch (err) {
    console.log("ADD LANGUAGE ERROR:", err.message);

    return interaction.reply({
      content: "❌ Failed to add language",
      ephemeral: true
    });
  }
}
