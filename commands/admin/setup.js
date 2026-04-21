import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';
import { supabase } from '../../db/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup server'),

  async execute(interaction) {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Admin only', ephemeral: true });
    }

    await supabase.from('guild_setup').upsert({
      guildid: interaction.guild.id,
      premium: false
    });

    await interaction.reply('✅ Setup complete');
  }
};
