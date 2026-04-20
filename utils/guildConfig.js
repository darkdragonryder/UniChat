import { supabase } from '../db/supabase.js';

// ==============================
// DEFAULT CONFIG
// ==============================
function defaultConfig(guildId) {
  const now = Date.now();

  return {
    guildid: guildId,

    languages: {},

    // 💎 PREMIUM SYSTEM
    premium: false,
    licenseKey: null,
    premiumStart: null,
    premiumExpiry: null,
    mode: 'reaction',

    // 🔑 LICENSE SYSTEM
    licenses: {
      devKeys: [],
      lifetimeKeys: [],
      usedKeys: {}
    },

    // 🏷️ REFERRAL SYSTEM
    referrals: {
      codes: {},
      leaderboard: {},
      usedServers: {},
      rewardsGiven: {},
      cycleStart: now
    },

    referredBy: null,

    referralRoles: {
      enabled: true,
      map: {
        5: "Trusted Referrer",
        10: "Elite Referrer",
        25: "Referral King",
        50: "Legend Referrer"
      }
    }
  };
}

// ==============================
// GET CONFIG (FAST + SAFE)
// ==============================
export async function getGuildConfig(guildId) {
  const { data, error } = await supabase
    .from('guild_setup')
    .select('*')
    .eq('guildid', guildId)
    .maybeSingle();

  if (error) {
    console.log('GET CONFIG ERROR:', error);
    return null;
  }

  // If not found → create default
  if (!data) {
    const config = defaultConfig(guildId);

    const { error: insertError } = await supabase
      .from('guild_setup')
      .insert(config);

    if (insertError) {
      console.log('CREATE CONFIG ERROR:', insertError);
      return config;
    }

    return config;
  }

  return {
    ...defaultConfig(guildId),
    ...data,

    licenses: {
      ...defaultConfig(guildId).licenses,
      ...(data.licenses || {})
    },

    referrals: {
      ...defaultConfig(guildId).referrals,
      ...(data.referrals || {})
    },

    referralRoles: {
      ...defaultConfig(guildId).referralRoles,
      ...(data.referralRoles || {})
    }
  };
}

// ==============================
// SAVE CONFIG (UPSERT)
// ==============================
export async function saveGuildConfig(guildId, config) {
  const safeConfig = {
    ...defaultConfig(guildId),
    ...config,

    guildid: guildId,

    licenses: {
      ...defaultConfig(guildId).licenses,
      ...(config.licenses || {})
    },

    referrals: {
      ...defaultConfig(guildId).referrals,
      ...(config.referrals || {})
    },

    referralRoles: {
      ...defaultConfig(guildId).referralRoles,
      ...(config.referralRoles || {})
    }
  };

  const { error } = await supabase
    .from('guild_setup')
    .upsert(safeConfig);

  if (error) {
    console.log('SAVE CONFIG ERROR:', error);
    throw error;
  }

  return safeConfig;
}
