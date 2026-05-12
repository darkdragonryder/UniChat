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

    await interaction.deferReply({ ephemeral: true });

    const supabase = db();
    const member = await guild.members.fetch(interaction.user.id);

    await guild.roles.fetch();

    for (const name of Object.values(roleNames)) {
      const role = guild.roles.cache.find(r => r.name === name);
      if (role) await member.roles.remove(role).catch(() => {});
    }

    const newRoleName = roleNames[lang];

    let newRole = guild.roles.cache.find(r => r.name === newRoleName);

    if (!newRole && lang !== "EN") {
      newRole = await guild.roles.create({
        name: newRoleName,
        mentionable: false
      });
    }

    if (newRole) {
      await member.roles.add(newRole).catch(() => {});
    }

    await supabase.from("user_settings").upsert({
      user_id: interaction.user.id,
      language: lang
    });

    return interaction.editReply(
      `🌍 Language set to ${roleNames[lang]}`
    );

  } catch (err) {
    return interaction.editReply("❌ Failed to set language.");
  }
}
