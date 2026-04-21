import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';
import { getGuildSetup, saveGuildSetup } from '../../services/guildSetupStore.js';

export default {
  meta: { licensed: true },

  data: new SlashCommandBuilder()
    .setName('revoke')
    .setDescription('Revoke this server license'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    const guild = await getGuildSetup(guildId);

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

    return interaction.reply({
      content: '🧨 License revoked',
      ephemeral: true
    });
  }
};
