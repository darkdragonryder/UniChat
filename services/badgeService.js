import { getGuildConfig } from '../utils/guildConfig.js';

// =====================================================
// BADGE DEFINITIONS
// =====================================================
const BADGES = [
  { uses: 25, name: '🥇 Elite Referrer' },
  { uses: 10, name: '🥈 Trusted Referrer' },
  { uses: 5, name: '🥉 Rising Referrer' }
];

// =====================================================
// GET BADGE FROM COUNT
// (PURE LOGIC ONLY — NO DISCORD CALLS)
// =====================================================
export function getBadgeFromCount(count) {
  let badge = null;

  for (const b of BADGES) {
    if (count >= b.uses) {
      badge = b.name;
    }
  }

  return badge;
}

// =====================================================
// GET TOP REFERRER (SAFE + PURE)
// =====================================================
export function getTopReferrerFromConfig(guildId) {
  const config = getGuildConfig(guildId);
  const lb = config?.referrals?.leaderboard || {};

  const sorted = Object.entries(lb).sort((a, b) => b[1] - a[1]);

  if (!sorted.length) return null;

  return {
    userId: sorted[0][0],
    count: sorted[0][1]
  };
}
