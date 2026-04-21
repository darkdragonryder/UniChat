import { commandGuard } from './middleware/commandGuard.js';

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await commandGuard(interaction, async (config) => {
      await command.execute(interaction, config);
    });

  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply('❌ Error executing command');
    } else {
      await interaction.reply({
        content: '❌ Error executing command',
        ephemeral: true
      });
    }
  }
});
