import { getGuildSetup } from './guildSetupStore.js';

/**
 * Returns true if guild has valid license
 */
export async function isGuildLicensed(guildId) {
  const config = await getGuildSetup(guildId);

  if (!config) return false;

  const active =
    config.premium === true &&
    (!config.premiumexpiry || Date.now() < config.premiumexpiry);

  return active;
}
