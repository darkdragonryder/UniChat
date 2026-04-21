import { SlashCommandBuilder } from 'discord.js';
import { getGuildSetup } from '../../services/guildSetupStore.js';

export default {
  meta: { licensed: true },

  data: new SlashCommandBuilder()
    .setName('license-info')
    .setDescription('View license info'),

  async execute(interaction) {
    const guild = await getGuildSetup(interaction.guild.id);

    return interaction.reply({
      content: `📄 License Info:
Premium: ${guild?.premium}
Key: ${guild?.licensekey || 'None'}
Expires: ${
        guild?.premiumexpiry
          ? new Date(guild.premiumexpiry).toLocaleString()
          : 'None'
      }`,
      ephemeral: true
    });
  }
};
