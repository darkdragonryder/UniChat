import { supabase } from "../services/supabase.js";

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
  const lang = interaction.options.getString("language");
  const guild = interaction.guild;

  const member = await guild.members.fetch(interaction.user.id);

  // REMOVE OLD ROLES
  for (const name of Object.values(roleNames)) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) await member.roles.remove(role).catch(() => {});
  }

  // ADD NEW ROLE
  const newRole = guild.roles.cache.find(r => r.name === roleNames[lang]);
  if (newRole) await member.roles.add(newRole).catch(() => {});

  // SAVE DB
  await supabase.from("user_settings").upsert({
    user_id: interaction.user.id,
    language: lang
  });

  return interaction.reply({
    content: `🌍 Language set to ${roleNames[lang]}`,
    ephemeral: true
  });
}
