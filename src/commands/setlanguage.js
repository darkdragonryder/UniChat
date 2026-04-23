import { SlashCommandBuilder } from "discord.js";
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

const commandData = new SlashCommandBuilder()
  .setName("setlanguage")
  .setDescription("Change your language")
  .addStringOption(option =>
    option
      .setName("language")
      .setDescription("Choose your language")
      .setRequired(true)
      .addChoices(
        { name: "🇬🇧 English", value: "EN" },
        { name: "🇪🇸 Spanish", value: "ES" },
        { name: "🇩🇪 German", value: "DE" },
        { name: "🇮🇹 Italian", value: "IT" },
        { name: "🇰🇷 Korean", value: "KO" },
        { name: "🇷🇺 Russian", value: "RU" },
        { name: "🇯🇵 Japanese", value: "JA" }
      )
  );

export default async function setLanguageCommand(interaction) {

  const lang = interaction.options.getString("language");
  const guild = interaction.guild;

  const member = await guild.members.fetch(interaction.user.id);

  // ================= REMOVE OLD LANGUAGE ROLES =================
  for (const roleName of Object.values(roleNames)) {
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role && member.roles.cache.has(role.id)) {
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

  // ================= SAVE TO DB =================
  await supabase.from("user_settings").upsert({
    user_id: interaction.user.id,
    language: lang
  });

  await interaction.reply({
    content: `🌍 Language updated to ${roleNames[lang]}`,
    ephemeral: true
  });
}

export { commandData };
