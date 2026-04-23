import { supabase } from "../services/supabase.js";

const roleMap = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian",
  EN: "English"
};

export default async function setLanguageCommand(interaction) {
  const lang = interaction.options.getString("language").toUpperCase();

  const roleName = roleMap[lang];

  if (!roleName) {
    return interaction.reply({
      content: "❌ Invalid language. Use EN, ES, DE, IT, KO, RU",
      ephemeral: true
    });
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);

  // remove old language roles
  const allRoles = Object.values(roleMap);

  for (const r of member.roles.cache.values()) {
    if (allRoles.includes(r.name)) {
      await member.roles.remove(r);
    }
  }

  // add new role
  const role = interaction.guild.roles.cache.find(r => r.name === roleName);

  if (role) {
    await member.roles.add(role);
  }

  // save preference
  await supabase.from("user_settings").upsert({
    user_id: interaction.user.id,
    language: lang
  });

  return interaction.reply({
    content: `✅ Language set to ${roleName}`,
    ephemeral: true
  });
}
