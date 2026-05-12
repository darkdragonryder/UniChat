import { db } from "../services/supabase.js";
import {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ComponentType
} from "discord.js";

// ================= LANGUAGES =================
const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  JA: "🇯🇵",
  KO: "🇰🇷",
  RU: "🇷🇺"
};

const roleNames = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  JA: "Japanese",
  KO: "Korean",
  RU: "Russian"
};

export default async function setupCommand(interaction, client) {

  const guild = interaction.guild;

  try {

    // ================= CHANNEL PICKER =================
    const channelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("unichat-channel-select")
      .setPlaceholder("Select the channel to mirror")
      .addChannelTypes(ChannelType.GuildText);

    const row = new ActionRowBuilder().addComponents(channelMenu);

    await interaction.reply({
      content: "📌 Select the main channel UniChat should mirror:",
      components: [row],
      ephemeral: true
    });

    const response = await interaction.fetchReply();

    const collected = await response.awaitMessageComponent({
      componentType: ComponentType.ChannelSelect,
      time: 60000
    });

    const selectedChannelId = collected.values[0];

    await collected.update({
      content: "⚙️ Setting up UniChat...",
      components: []
    });

    const supabase = db();

    await guild.channels.fetch();
    await guild.roles.fetch();

    // ================= BASE CHANNEL =================
    const baseChannel = guild.channels.cache.get(selectedChannelId);

    if (!baseChannel) {
      return interaction.editReply("❌ Selected channel not found.");
    }

    const baseCategory = baseChannel.parent;

    let baseName = baseChannel.name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!baseName) baseName = "chat";

    // ================= UNI CHAT CATEGORY =================
    let category = guild.channels.cache.find(
      c =>
        c.name === "🌍 UniChat" &&
        c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: ChannelType.GuildCategory
      });
    }

    // ================= CATEGORY POSITION =================
    if (baseCategory && category) {
      await category.setPosition(baseCategory.position + 1).catch(() => {});
    }

    // ================= ROLES =================
    const roles = {};

    for (const [lang, name] of Object.entries(roleNames)) {

      let role = guild.roles.cache.find(r => r.name === name);

      if (!role) {
        role = await guild.roles.create({
          name,
          mentionable: false
        });
      }

      roles[lang] = role;
    }

    // ================= BASE CHANNEL PERMISSIONS =================
    await baseChannel.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      {
        id: client.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      }
    ]);

    if (baseCategory) {
      await baseCategory.permissionOverwrites.edit(
        guild.roles.everyone,
        { ViewChannel: true }
      ).catch(() => {});
    }

    const enabled_channels = {
      EN: baseChannel.id
    };

    // ================= LANGUAGE CHANNELS =================
    for (const [lang, emoji] of Object.entries(languages)) {

      const role = roles[lang];

      // ✅ YOUR ORIGINAL FORMAT (kept)
      const channelName = `${baseName}-${emoji}`;

      let channel = guild.channels.cache.find(
        c =>
          c.name === channelName &&
          c.parentId === category.id
      );

      if (!channel) {
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id
        });
      }

      await channel.permissionOverwrites.set([
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
          id: client.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]);

      enabled_channels[lang] = channel.id;
    }

    // ================= DATABASE =================
    const { error } = await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      enabled_channels,
      base_channel_name: baseName,
      default_channel: baseChannel.id,
      active_channel: baseChannel.id
    });

    if (error) {
      console.log("DB ERROR:", error.message);
      return interaction.editReply("❌ DB save failed.");
    }

    // ================= BOT ROLE =================
    let botRole = guild.roles.cache.find(r =>
      r.name.toLowerCase().includes("unichat")
    );

    if (!botRole) {
      botRole = await guild.roles.create({
        name: "🤖 UniChat Bot",
        color: 0x5865f2
      });
    }

    const botMember = await guild.members.fetch(client.user.id);
    await botMember.roles.add(botRole).catch(() => {});

    return interaction.editReply("✅ UniChat setup complete!");

  } catch (err) {
    console.log("SETUP ERROR:", err);
    return interaction.editReply("❌ Setup failed.");
  }
}
