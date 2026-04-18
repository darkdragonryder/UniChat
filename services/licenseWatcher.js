import db from './db.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ==============================
// RUN EXPIRY WARNING CHECK
// ==============================
export async function runExpiryWarnings(client) {
  const now = Date.now();
  const warningTime = 24 * 60 * 60 * 1000; // 24 hours

  const rows = db.prepare(`
    SELECT DISTINCT usedByGuild, usedByUser, expiresAt
    FROM licenses
    WHERE used = 1
      AND expiresAt IS NOT NULL
  `).all();

  for (const row of rows) {
    const timeLeft = row.expiresAt - now;

    // skip expired
    if (timeLeft <= 0) continue;

    // only warn if within 24h
    if (timeLeft > warningTime) continue;

    try {
      const user = await client.users.fetch(row.usedByUser);

      if (!user) continue;

      await user.send(
        `⚠️ **License Expiry Warning**\n\n` +
        `Your premium license will expire in **${Math.ceil(timeLeft / 3600000)} hours**.\n\n` +
        `Renew it soon to avoid losing access.`
      );

    } catch (err) {
      console.log('DM failed for user:', row.usedByUser);
    }
  }
}
