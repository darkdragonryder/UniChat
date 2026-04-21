import { SlashCommandBuilder } from 'discord.js';
import { getLicense, useLicense } from '../../services/licenseService.js';
import { saveGuild } from '../../services/guildSetup.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem license key')
    .addStringOption(opt =>
      opt.setName('key').setRequired(true)
    ),

  async execute(interaction) {
    const key = interaction.options.getString('key');
    const guildId = interaction.guild.id;

    const license = await getLicense(key);

    if (!license || license.used) {
      return interaction.reply({
        content: '❌ Invalid or used key',
        ephemeral: true
      });
    }

    await useLicense(key, guildId, license.expires_at);

    await saveGuild(guildId, {
      premium: true,
      licensekey: key,
      premiumexpiry: license.expires_at
    });

    return interaction.reply({
      content: '✅ License activated',
      ephemeral: true
    });
  }
};
