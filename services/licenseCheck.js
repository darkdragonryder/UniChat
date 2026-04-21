import { getGuildSetup } from './guildSetupStore.js';

export async function isGuildLicensed(guildId) {
  const guild = await getGuildSetup(guildId);

  if (!guild) return false;

  const hasPremium = guild.premium === true;
  const notExpired =
    !guild.premiumexpiry || Date.now() < guild.premiumexpiry;

  return hasPremium && notExpired;
}
