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
