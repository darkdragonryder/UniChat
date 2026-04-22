import {
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

const LANGUAGES = {
  es: { name: "Spanish", flag: "🇪🇸" },
  de: { name: "German", flag: "🇩🇪" },
  it: { name: "Italian", flag: "🇮🇹" },
  ko: { name: "Korean", flag: "🇰🇷" }
};

export default async function uninstallCommand(message) {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Admin only");
  }

  const guild = message.guild;

  // 🧹 DELETE COMMAND MESSAGE
  await message.delete().catch(() => {});

  // ================= UI =================
  const dismissButton = new ButtonBuilder()
    .setCustomId("dismiss_uninstall")
    .setLabel("Dismiss")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(dismissButton);

  const statusMsg = await message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🧹 Uninstalling UniChat...")
        .setColor("Orange")
    ],
    components: [row]
  });

  // ================= DELETE CHANNELS =================
  for (const lang of Object.values(LANGUAGES)) {
    const ch = guild.channels.cache.find(
      c => c.name === `general-${lang.flag}`
    );
    if (ch) await ch.delete().catch(() => {});
  }

  // ================= DELETE CATEGORY =================
  const category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === ChannelType.GuildCategory
  );
  if (category) await category.delete().catch(() => {});

  // ================= DELETE ROLES =================
  for (const lang of Object.values(LANGUAGES)) {
    const role = guild.roles.cache.find(r => r.name === lang.name);
    if (role) await role.delete().catch(() => {});
  }

  // ================= DB =================
  const { supabase } = await import("../services/supabase.js");

  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  // ================= FINAL =================
  await statusMsg.edit({
    embeds: [
      new EmbedBuilder()
        .setTitle("✅ UniChat Removed")
        .setDescription("All channels, roles, and data removed.")
        .setColor("Red")
    ],
    components: [row]
  });

  // ================= AUTO CLEAN =================
  setTimeout(() => {
    statusMsg.delete().catch(() => {});
  }, 15000);
}
