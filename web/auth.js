import crypto from 'crypto';

const ADMIN_KEY = process.env.ADMIN_KEY;

// simple API key check (safe for now)
export function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// future: generate API keys
export function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}
