import { getGuildSetup } from '../services/guildSetupStore.js';

const punishMap = new Map();
const userActionMap = new Map();

export async function commandGuard(interaction, next) {
  const userId = interaction.user.id;
  const guildId = interaction.guild?.id;
  const now = Date.now();

  // =========================
  // LOAD CONFIG
  // =========================
  const config = await getGuildSetup(guildId);

  // fallback safe config
  const safeConfig = config || {
    premium: false,
    premiumExpiry: null
  };

  // =========================
  // LICENSE CHECK
  // =========================
  if (
    !safeConfig.premium ||
    (safeConfig.premiumExpiry && now > safeConfig.premiumExpiry)
  ) {
    return interaction.reply({
      content: '❌ This server is not licensed.',
      ephemeral: true
    });
  }

  // =========================
  // DEV-FRIENDLY FRAUD (SO YOU STOP GETTING LOCKED)
  // =========================
  const actions = userActionMap.get(userId) || [];
  const recent = actions.filter(t => now - t < 10 * 60 * 1000);

  // ONLY punish if extreme spam (safe for testing)
  if (recent.length >= 20) {
    punishMap.set(userId, { until: now + 60 * 1000 });
    return interaction.reply({
      content: '🚫 Rate limited (temporary)',
      ephemeral: true
    });
  }

  recent.push(now);
  userActionMap.set(userId, recent);

  // =========================
  // RUN COMMAND
  // =========================
  return next(safeConfig);
}
