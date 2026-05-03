import { db } from "../services/supabase.js";

const roleNames = {
  EN: "English",
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

    if (!lang || !roleNames[lang]) {
      return interaction.reply({
        content: "❌ Invalid language selected.",
        ephemeral: true
      });
    }

    const supabase = db(); // ✅ FIX: initialise DB

    const member = await guild.members.fetch(interaction.user.id);

    await guild.roles.fetch();

    // ================= REMOVE OLD ROLES =================
    for (const name of Object.values(roleNames)) {
      const role = guild.roles.cache.find(r => r.name === name);
      if (role) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    // ================= ADD NEW ROLE =================
    const newRole = guild.roles.cache.find(
      r => r.name === roleNames[lang]
    );

    if (newRole) {
      await member.roles.add(newRole).catch(() => {});
    }

    // ================= SAVE DB =================
    const { error } = await supabase.from("user_settings").upsert({
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

    return interaction.reply({
      content: `🌍 Language set to ${roleNames[lang]}`,
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
