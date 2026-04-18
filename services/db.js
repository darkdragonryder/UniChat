import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// ==============================
// RAILWAY SAFE DATA PATH
// ==============================
const DATA_DIR = process.env.DATA_DIR || '/data';
const DB_PATH = path.join(DATA_DIR, 'bot.db');

// ==============================
// ENSURE FOLDER EXISTS
// ==============================
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ==============================
// OPEN DATABASE
// ==============================
const db = new Database(DB_PATH);

// ==============================
// SAFETY + PERFORMANCE MODE
// ==============================
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// ==============================
// INIT TABLES
// ==============================
db.exec(`
CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  guildId TEXT,
  ownerId TEXT,
  usedCount INTEGER DEFAULT 0,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT,
  userId TEXT,
  code TEXT,
  ownerId TEXT,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS licenses (
  key TEXT PRIMARY KEY,
  used INTEGER DEFAULT 0,
  type TEXT,
  durationDays INTEGER,
  createdAt INTEGER,
  usedAt INTEGER,
  expiresAt INTEGER,
  usedByGuild TEXT,
  usedByUser TEXT
);
`);

console.log(`📦 DB loaded at: ${DB_PATH}`);

export default db;
