import { globalGuard } from './middleware/globalGuard.js';

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    // 🔒 GLOBAL LICENSE CHECK
    const allowed = await globalGuard(interaction, command);
    if (!allowed) return;

    await command.execute(interaction);

  } catch (err) {
    console.error(err);

    const msg = '❌ Error executing command';

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});
