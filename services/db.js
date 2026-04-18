import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'bot.db');

// ensure folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/*
========================================
⚠️ TEMP DB RESET (REMOVE AFTER FIRST RUN)
========================================
*/
if (process.env.RESET_DB === 'true') {
  console.log('⚠️ RESET_DB enabled - deleting database file');

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️ Database deleted');
  }
}

// open DB
const db = new Database(DB_PATH);

// enable safety mode
db.pragma('journal_mode = WAL');

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
  used INTEGER,
  type TEXT,
  durationDays INTEGER,
  createdAt INTEGER,
  usedAt INTEGER,
  expiresAt INTEGER,
  usedByGuild TEXT,
  usedByUser TEXT
);
`);

export default db;
