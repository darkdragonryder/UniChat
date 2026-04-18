import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-revoke')
    .setDescription('Revoke a license key (OWNER ONLY)')
    .addStringOption(option =>
      option
        .setName('key')
        .setDescription('License key to revoke')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '❌ No permission', ephemeral: true });
      }

      const key = interaction.options.getString('key');

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) {
        return interaction.reply({ content: '❌ License not found', ephemeral: true });
      }

      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          used: true,
          expiresAt: Date.now() // force expire immediately
        })
        .eq('key', key);

      if (updateError) throw updateError;

      return interaction.reply({
        content: `🗑️ License revoked:\n🔑 \`${key}\``,
        ephemeral: true
      });

    } catch (err) {
      console.log(err);
      return interaction.reply({ content: '❌ Failed to revoke license', ephemeral: true });
    }
  }
};
