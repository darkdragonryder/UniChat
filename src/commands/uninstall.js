import { ChannelType, EmbedBuilder } from "discord.js";

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
  const statusMsg = await message.reply("🧹 Uninstalling UniChat...");

  // ================= CHANNELS =================
  for (const lang of Object.values(LANGUAGES)) {
    const ch = guild.channels.cache.find(
      c => c.name === `general-${lang.flag}`
    );
    if (ch) await ch.delete().catch(() => {});
  }

  // ================= CATEGORY =================
  const category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === ChannelType.GuildCategory
  );
  if (category) await category.delete().catch(() => {});

  // ================= ROLES =================
  for (const lang of Object.values(LANGUAGES)) {
    const role = guild.roles.cache.find(r => r.name === lang.name);
    if (role) await role.delete().catch(() => {});
  }

  // ================= DB =================
  const { supabase } = await import("../services/supabase.js");

  await supabase.from("guild_settings").delete().eq("guild_id", guild.id);

  setTimeout(() => message.delete().catch(() => {}), 3000);

  const embed = new EmbedBuilder()
    .setTitle("🧹 UniChat Removed")
    .setColor("Red");

  await statusMsg.edit({ content: "", embeds: [embed] });
}
