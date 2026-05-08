import { db } from "../services/supabase.js";
import { PermissionsBitField, ChannelType } from "discord.js";

const roleNames = {
  FR: "French",
  PT: "Portuguese",
  NL: "Dutch",
  PL: "Polish",
  TR: "Turkish",
  ZH: "Chinese",
  AR: "Arabic"
};

export default async function addLanguageCommand(interaction) {
  try {
    const supabase = db();

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

    if (channels[code]) {
      return interaction.editReply(`❌ Language **${code}** already exists.`);
    }

    let category = guild.channels.cache.find(
      c => c.name === "🌍 UniChat" && c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: ChannelType.GuildCategory
      });
    }

    let role = guild.roles.cache.find(r => r.name === (roleNames[code] || name));

    if (!role) {
      role = await guild.roles.create({
        name: roleNames[code] || name,
        reason: "UniChat language role"
      });
    }

    // FIX: Use PermissionsBitField instead of string arrays
    const channel = await guild.channels.create({
      name: `${base}-${emoji}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: role.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: guild.members.me.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

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
      `✅ Added **${name} (${code})**
📍 Channel: ${channel}`
    );

  } catch (err) {
    console.log("ADD LANGUAGE ERROR:", err);

    try {
      return interaction.editReply({
        content: "❌ Failed to add language",
        ephemeral: true
      });
    } catch {
      return;
    }
  }
}
