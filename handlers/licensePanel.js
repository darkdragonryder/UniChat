import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { supabase } from '../db/supabase.js';

export async function handleLicensePanel(interaction) {

  // =========================
  // SELECT MENU HANDLER
  // =========================
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId !== 'license_select') return;

    const licenseId = interaction.values[0];

    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (!license) {
      return interaction.reply({
        content: '❌ License not found',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📄 License Details')
      .addFields(
        { name: 'Server', value: license.guild_name || 'Unknown', inline: true },
        { name: 'User', value: license.user_id || 'Unknown', inline: true },
        { name: 'Key', value: license.key, inline: false },
        { name: 'Expires', value: license.expires_at || 'Lifetime', inline: true }
      )
      .setColor(0xffcc00);

    const revokeBtn = new ButtonBuilder()
      .setCustomId(`license_revoke_${license.id}`)
      .setLabel('Revoke License')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(revokeBtn);

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }

  // =========================
  // BUTTON HANDLER
  // =========================
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith('license_revoke_')) return;

    const licenseId = interaction.customId.split('_')[2];

    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId);

    if (error) {
      return interaction.reply({
        content: '❌ Failed to revoke license',
        ephemeral: true
      });
    }

    return interaction.reply({
      content: '✅ License revoked successfully',
      ephemeral: true
    });
  }
}
