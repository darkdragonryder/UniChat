export function applyPremiumExpiry(config) {
  if (!config) return config;

  // not premium → skip
  if (!config.premium) return config;

  // lifetime/dev → no expiry → keep premium
  if (!config.premiumExpiry) return config;

  const now = Date.now();

  // expired
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
