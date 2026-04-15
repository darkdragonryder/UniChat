export function applyPremiumExpiry(config) {
  if (!config) return config;

  // No premium → nothing to do
  if (!config.premium) return config;

  const now = Date.now();

  // No expiry = lifetime / manual mode → keep active
  if (!config.premiumExpiry) return config;

  // Expired check
  if (now > config.premiumExpiry) {
    config.premium = false;
    config.mode = 'reaction';
    config.licenseKey = null;
    config.premiumStart = null;
    config.premiumExpiry = null;

    console.log("⚠️ Premium expired");
  }

  return config;
}
