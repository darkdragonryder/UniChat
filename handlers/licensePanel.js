import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { supabase } from '../db/supabase.js';

export async function handleLicensePanel(interaction) {

  // =========================
  // SELECT LICENSE
  // =========================
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId !== 'license_select') return;

    const key = interaction.values[0];

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !license) {
      return interaction.reply({
        content: '❌ License not found',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔐 License Panel')
      .setColor(0x00d4ff)
      .addFields(
        { name: '🔑 Key', value: license.key, inline: false },
        { name: '🏠 Used By Guild', value: license.usedbyguild || 'Not used', inline: true },
        { name: '📊 Used', value: license.used ? 'Yes' : 'No', inline: true },
        { name: '⏳ Expires', value: license.expires_at || 'Lifetime', inline: true },
        { name: '📅 Used At', value: license.usedat || 'Never', inline: true }
      );

    const revokeBtn = new ButtonBuilder()
      .setCustomId(`revoke_${license.key}`)
      .setLabel('Revoke License')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(revokeBtn);

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }

  // =========================
  // REVOKE LICENSE
  // =========================
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith('revoke_')) return;

    const key = interaction.customId.replace('revoke_', '');

    // 1. Reset license
    const { error: licErr } = await supabase
      .from('licenses')
      .update({
        used: false,
        usedbyguild: null,
        usedat: null
      })
      .eq('key', key);

    // 2. Remove from guild_setup
    const { error: guildErr } = await supabase
      .from('guild_setup')
      .update({
        premium: false,
        licensekey: null,
        premiumexpirary: null
      })
      .eq('licensekey', key);

    if (licErr || guildErr) {
      console.error({ licErr, guildErr });

      return interaction.reply({
        content: '❌ Failed to revoke license',
        ephemeral: true
      });
    }

    return interaction.reply({
      content: '✅ License revoked and guild downgraded',
      ephemeral: true
    });
  }
}
