export function applyPremiumExpiry(config) {
  if (!config.premium || !config.premiumExpiry) return config;

  if (Date.now() > config.premiumExpiry) {
    config.premium = false;
    config.mode = 'reaction';
    config.premiumStart = null;
    config.premiumExpiry = null;
  }

  return config;
}
