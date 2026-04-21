import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { supabase } from '../db/supabase.js';
import { logAction } from '../services/auditLogger.js';
import { resolveUser } from '../services/userResolver.js';

export async function handleLicensePanel(interaction) {

  const client = interaction.client;

  // =========================
  // SELECT LICENSE
  // =========================
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId !== 'license_select') return;

    const key = interaction.values[0];

    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', key)
      .single();

    if (!license) {
      return interaction.reply({
        content: '❌ License not found',
        ephemeral: true
      });
    }

    const userTag = await resolveUser(client, license.usedbyguild || license.user_id);

    const embed = new EmbedBuilder()
      .setTitle('🔐 License Dashboard V6')
      .setColor(0x00e5ff)
      .addFields(
        { name: '🔑 Key', value: license.key, inline: false },
        { name: '🏠 Guild', value: license.usedbyguild || 'Not used', inline: true },
        { name: '👤 User', value: userTag, inline: true },
        { name: '📊 Used', value: license.used ? 'Yes' : 'No', inline: true },
        { name: '⏳ Expires', value: license.expires_at || 'Lifetime', inline: true }
      );

    const btn = new ButtonBuilder()
      .setCustomId(`v6_revoke_${license.key}`)
      .setLabel('Revoke License')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(btn);

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }

  // =========================
  // REVOKE LICENSE (V6 SAFE)
  // =========================
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith('v6_revoke_')) return;

    const key = interaction.customId.replace('v6_revoke_', '');

    const { error } = await supabase
      .from('licenses')
      .update({
        used: false,
        usedbyguild: null,
        usedat: null
      })
      .eq('key', key);

    if (error) {
      return interaction.reply({
        content: '❌ Failed to revoke license',
        ephemeral: true
      });
    }

    // audit log
    await logAction({
      action: 'LICENSE_REVOKE',
      user_id: interaction.user.id,
      guild_id: interaction.guildId,
      license_key: key,
      details: 'License revoked via panel V6'
    });

    return interaction.reply({
      content: '✅ License revoked successfully (V6)',
      ephemeral: true
    });
  }
}
