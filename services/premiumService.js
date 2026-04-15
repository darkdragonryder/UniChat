export function applyPremiumExpiry(config) {
  if (!config || typeof config !== 'object') return config;

  // ensure safe defaults
  config.premium ??= false;
  config.mode ??= 'reaction';

  // No premium → nothing to do
  if (!config.premium) return config;

  const now = Date.now();

  // Lifetime / manual mode → no expiry
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
