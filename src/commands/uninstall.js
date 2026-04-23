import { supabase } from "../services/supabase.js";

const roles = ["English", "Spanish", "German", "Italian", "Korean", "Russian"];

export default async function uninstallCommand(interaction) {

  await interaction.reply({
    content: "🧹 Removing UniChat (full cleanup)...",
    ephemeral: true
  });

  const guild = interaction.guild;

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  const channels = await guild.channels.fetch();

  // ================= 1. DELETE FROM DB (IF EXISTS) =================
  const dbChannels = Object.values(data?.enabled_channels ?? {});

  for (const id of dbChannels) {
    const ch = channels.get(id);
    if (ch) {
      await ch.delete().catch(err => {
        console.log("DB DELETE FAIL:", err.message);
      });
    }
  }

  // ================= 2. CATEGORY SCAN (CRITICAL FIX) =================
  const category = channels.find(c => c.name === "🌍 UniChat");

  if (category) {
    const children = channels.filter(c => c.parentId === category.id);

    for (const ch of children.values()) {
      await ch.delete().catch(err => {
        console.log("CATEGORY DELETE FAIL:", err.message);
      });
    }

    await category.delete().catch(() => {});
  }

  // ================= 3. NAME FALLBACK (LAST RESORT FIX) =================
  for (const ch of channels.values()) {
    if (!ch.name) continue;

    if (
      ch.name.startsWith("general-") ||
      ch.name.includes("UniChat")
    ) {
      await ch.delete().catch(() => {});
    }
  }

  // ================= 4. ROLES =================
  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) {
      await role.delete().catch(() => {});
    }
  }

  // ================= 5. CLEAN DB =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.followUp({
    content: "✅ UniChat fully removed (all channels, roles, data).",
    ephemeral: true
  });
}
