import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { supabase } from '../db/supabase.js';

// simple in-memory confirmation cache (safe for now)
const pendingRevoke = new Map();

export async function handleLicensePanel(interaction) {

  // =========================
  // SELECT LICENSE
  // =========================
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId !== 'license_select') return;

    const licenseId = interaction.values[0];

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (error || !license) {
      return interaction.reply({
        content: '❌ License not found',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔐 License Details (V3)')
      .setColor(0x00ffcc)
      .addFields(
        { name: '🏠 Server', value: license.guild_name || 'Unknown', inline: true },
        { name: '👤 User ID', value: license.user_id || 'Unknown', inline: true },
        { name: '🔑 Key', value: license.key, inline: false },
        { name: '⏳ Expires', value: license.expires_at || 'Lifetime', inline: true },
        { name: '📊 Status', value: license.expires_at ? 'Timed' : 'Lifetime', inline: true }
      );

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
  // REVOKE BUTTON (STEP 1)
  // =========================
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith('license_revoke_')) return;

    const licenseId = interaction.customId.split('_')[2];

    // store pending confirmation
    pendingRevoke.set(interaction.user.id, licenseId);

    const confirm = new ButtonBuilder()
      .setCustomId(`confirm_revoke`)
      .setLabel('Confirm Revoke')
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId(`cancel_revoke`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirm, cancel);

    return interaction.reply({
      content: '⚠️ Are you sure you want to revoke this license?',
      components: [row],
      ephemeral: true
    });
  }

  // =========================
  // CONFIRM REVOKE
  // =========================
  if (interaction.isButton() && interaction.customId === 'confirm_revoke') {

    const licenseId = pendingRevoke.get(interaction.user.id);

    if (!licenseId) {
      return interaction.reply({
        content: '❌ No pending action found',
        ephemeral: true
      });
    }

    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId);

    pendingRevoke.delete(interaction.user.id);

    if (error) {
      return interaction.reply({
        content: '❌ Failed to revoke license',
        ephemeral: true
      });
    }

    return interaction.update({
      content: '✅ License successfully revoked',
      components: [],
      embeds: []
    });
  }

  // =========================
  // CANCEL REVOKE
  // =========================
  if (interaction.isButton() && interaction.customId === 'cancel_revoke') {

    pendingRevoke.delete(interaction.user.id);

    return interaction.update({
      content: '❎ Revocation cancelled',
      components: [],
      embeds: []
    });
  }
}
