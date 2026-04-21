import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import { supabase } from '../db/supabase.js';
import { saveGuildSetup } from '../services/guildSetupStore.js';

export async function handleLicensePanel(interaction) {

  // =========================
  // GUILD SELECTED
  // =========================
  if (interaction.customId === 'license_select_guild') {
    const guildId = interaction.values[0];

    const { data: guild } = await supabase
      .from('guild_setup')
      .select('*')
      .eq('guildid', guildId)
      .maybeSingle();

    const embed = new EmbedBuilder()
      .setTitle(`📄 Guild License`)
      .setDescription(`Guild ID: ${guildId}`)
      .addFields(
        { name: 'Premium', value: String(guild?.premium ?? false), inline: true },
        { name: 'License Key', value: guild?.licensekey || 'None', inline: true },
        {
          name: 'Expiry',
          value: guild?.premiumexpiry
            ? new Date(guild.premiumexpiry).toLocaleString()
            : 'None',
          inline: true
        }
      )
      .setColor(0xffcc00);

    const revokeBtn = new ButtonBuilder()
      .setCustomId(`license_revoke_${guildId}`)
      .setLabel('Revoke License')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(revokeBtn);

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }

  // =========================
  // REVOKE BUTTON
  // =========================
  if (interaction.customId.startsWith('license_revoke_')) {
    const guildId = interaction.customId.split('_')[2];

    const { data: guild } = await supabase
      .from('guild_setup')
      .select('*')
      .eq('guildid', guildId)
      .maybeSingle();

    if (guild?.licensekey) {
      await supabase
        .from('licenses')
        .update({
          used: false,
          usedbyguild: null,
          usedat: null
        })
        .eq('key', guild.licensekey);
    }

    await saveGuildSetup(guildId, {
      premium: false,
      licensekey: null,
      premiumexpiry: null
    });

    return interaction.update({
      content: `🧨 License revoked for ${guildId}`,
      embeds: [],
      components: []
    });
  }
}
