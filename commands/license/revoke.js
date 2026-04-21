import { SlashCommandBuilder } from 'discord.js';
import { supabase } from '../../db/supabase.js';
import { getGuild, saveGuild } from '../../services/guildSetup.js';

export default {
  data: new SlashCommandBuilder()
    .setName('revoke')
    .setDescription('Revoke license'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    const guild = await getGuild(guildId);

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

    await saveGuild(guildId, {
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
