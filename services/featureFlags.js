export const FEATURES = {
  PAYMENT_ENABLED: false,
  AUTO_RENEW: false,
  WEB_DASHBOARD: false
};

export function isFeatureEnabled(flag) {
  return FEATURES[flag] === true;
}
