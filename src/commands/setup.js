import { supabase } from "../services/supabase.js";
import { ChannelType, PermissionsBitField } from "discord.js";

const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  JA: "🇯🇵",
  KO: "🇰🇷"
};

const roleNames = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  JA: "Japanese",
  KO: "Korean"
};

export default async function setupCommand(interaction, client) {

  await interaction.reply({
    content: "⚙️ Setting up UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  try {
    await guild.channels.fetch();
    await guild.roles.fetch();

    // ================= BASE CHANNEL (ENGLISH) =================
    const baseChannel = interaction.channel;
    const baseChannelId = baseChannel.id;
    const parentCategory = baseChannel.parent;

    let baseName = baseChannel.name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!baseName) baseName = "chat";

    // ================= CREATE / FIND UNICHAT CATEGORY =================
    let category = guild.channels.cache.find(
      c =>
        c.name === "🌍 UniChat" &&
        c.type === ChannelType.GuildCategory &&
        c.parentId === parentCategory?.id
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: ChannelType.GuildCategory,
        parent: parentCategory?.id || null
      });
    }

    // ================= CREATE LANGUAGE ROLES =================
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

    // ================= ENSURE BASE CHANNEL IS OPEN =================
    await baseChannel.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ]);

    const enabled_channels = {
      EN: baseChannelId // 🔥 STILL REQUIRED FOR TRANSLATION ENGINE
    };

    // ================= CREATE LANGUAGE CHANNELS =================
    for (const [lang, emoji] of Object.entries(languages)) {

      const role = roles[lang];
      const channelName = `${baseName}-${emoji}`;

      let channel = guild.channels.cache.find(
        c => c.name === channelName && c.parentId === category.id
      );

      if (!channel) {
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id
        });
      }

      // 🔥 LOCK CHANNEL TO ROLE
      await channel.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: role.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ]);

      enabled_channels[lang] = channel.id;
    }

    // ================= SAVE DATABASE =================
    const { error } = await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      enabled_channels,
      base_channel_name: baseName,
      default_channel: baseChannelId,
      active_channel: baseChannelId
    });

    if (error) {
      console.log("DB ERROR:", error.message);
      return interaction.editReply("❌ Failed to save setup.");
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

    // ================= DONE =================
    return interaction.editReply("✅ UniChat setup complete!");

  } catch (err) {
    console.log("SETUP ERROR:", err.message);
    return interaction.editReply("❌ Setup failed.");
  }
}
