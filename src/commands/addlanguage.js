import { db } from "../services/supabase.js";
import { PermissionsBitField, ChannelType } from "discord.js";

export default async function addLanguageCommand(interaction) {
  try {
    const supabase = db();

    const code = interaction.options.getString("code")?.toUpperCase();
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

    if (channels[code]) {
      return interaction.editReply("❌ Language already exists");
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

    const role = await guild.roles.create({
      name,
      mentionable: false
    });

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
        }
      ]
    });

    channels[code] = channel.id;

    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      enabled_channels: channels,
      base_channel_name: base
    });

    return interaction.editReply(
      `✅ Added ${name} (${code})`
    );

  } catch (err) {
    return interaction.editReply("❌ Failed to add language");
  }
}
