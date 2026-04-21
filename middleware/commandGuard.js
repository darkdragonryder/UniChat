import { getGuildSetup } from '../services/guildSetupStore.js';
import { checkFraud } from '../services/fraudCheck.js';

// ==============================
// GLOBAL COMMAND GUARD
// ==============================
export async function commandGuard(interaction, commandFn) {
  const guildId = interaction.guild?.id;
  const userId = interaction.user.id;

  try {
    // =========================
    // NO GUILD SAFE EXIT
    // =========================
    if (!guildId) {
      return interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true
      });
    }

    // =========================
    // LOAD GUILD CONFIG
    // =========================
    const config = await getGuildSetup(guildId);

    if (!config) {
      return interaction.reply({
        content: '❌ Server not set up.',
        ephemeral: true
      });
    }

    // =========================
    // FRAUD CHECK
    // =========================
    const fraud = checkFraud({
      userId,
      ownerId: process.env.OWNER_ID,
      code: interaction.commandName,
      guildId
    });

    if (!fraud.ok) {
      return interaction.reply({
        content: `🚫 Blocked: ${fraud.reason}`,
        ephemeral: true
      });
    }

    // =========================
    // LICENSE CHECK (GLOBAL)
    // =========================
    const premium = config?.premium === true;
    const notExpired =
      !config?.premiumExpiry || Date.now() < config.premiumExpiry;

    if (!premium || !notExpired) {
      return interaction.reply({
        content: '❌ This server is not licensed.',
        ephemeral: true
      });
    }

    // =========================
    // RUN COMMAND
    // =========================
    return await commandFn(config);

  } catch (err) {
    console.error('COMMAND GUARD ERROR:', err);

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({
        content: '❌ Internal error in guard',
        ephemeral: true
      });
    }

    return interaction.reply({
      content: '❌ Internal error',
      ephemeral: true
    });
  }
}
