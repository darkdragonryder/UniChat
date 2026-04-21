export function isGuildLicensed(config) {
  return config?.premium === true &&
    (!config?.premiumExpiry || Date.now() < config.premiumExpiry);
}
