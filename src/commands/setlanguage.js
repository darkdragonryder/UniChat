import { db } from "../services/supabase.js";

const roleNames = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian",
  JA: "Japanese"
};

export default async function setLanguageCommand(interaction) {
  try {

    const lang = interaction.options.getString("language");
    const guild = interaction.guild;

    if (!lang) {
      return interaction.reply({
        content: "❌ Invalid language selected.",
        ephemeral: true
      });
    }

    const supabase = db();

    const member = await guild.members.fetch(interaction.user.id);

    await guild.roles.fetch();

    // ================= REMOVE OLD LANGUAGE ROLES =================
    for (const name of Object.values(roleNames)) {

      const role = guild.roles.cache.find(
        r => r.name === name
      );

      if (role) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    // ================= ADD NEW ROLE IF NOT ENGLISH =================
    if (lang !== "EN") {

      const roleName = roleNames[lang];

      if (!roleName) {
        return interaction.reply({
          content: "❌ Invalid language selected.",
          ephemeral: true
        });
      }

      const newRole = guild.roles.cache.find(
        r => r.name === roleName
      );

      if (newRole) {
        await member.roles.add(newRole).catch(() => {});
      }
    }

    // ================= SAVE USER LANGUAGE =================
    const { error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: interaction.user.id,
        language: lang
      });

    if (error) {
      console.log("SET LANGUAGE DB ERROR:", error.message);

      return interaction.reply({
        content: "❌ Failed to save language.",
        ephemeral: true
      });
    }

    // ================= CLEANUP MENU MESSAGE =================
    try {
      if (interaction.message) {
        await interaction.message.delete().catch(() => {});
      }
    } catch {}

    return interaction.reply({
      content:
        lang === "EN"
          ? "✅ You will use the default English channel."
          : `🌍 Language set successfully.`,
      ephemeral: true
    });

  } catch (err) {

    console.log("SET LANGUAGE ERROR:", err.message);

    return interaction.reply({
      content: "❌ Failed to set language.",
      ephemeral: true
    });
  }
}
