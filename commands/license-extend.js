import { SlashCommandBuilder } from 'discord.js';
import supabase from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-extend')
    .setDescription('Extend a license duration (OWNER ONLY)')
    .addStringOption(o =>
      o.setName('key').setRequired(true).setDescription('License key')
    )
    .addIntegerOption(o =>
      o.setName('days').setRequired(true).setDescription('Days to add')
    ),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '❌ No permission', ephemeral: true });
      }

      const key = interaction.options.getString('key');
      const days = interaction.options.getInteger('days');

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) {
        return interaction.reply({ content: '❌ License not found', ephemeral: true });
      }

      const currentExpiry = data.expiresAt || Date.now();
      const newExpiry = currentExpiry + days * 86400000;

      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          expiresAt: newExpiry,
          durationDays: (data.durationDays || 0) + days
        })
        .eq('key', key);

      if (updateError) throw updateError;

      return interaction.reply({
        content:
          `⏳ License extended:\n` +
          `🔑 \`${key}\`\n` +
          `➕ +${days} days`,
        ephemeral: true
      });

    } catch (err) {
      console.log(err);
      return interaction.reply({ content: '❌ Failed to extend license', ephemeral: true });
    }
  }
};
