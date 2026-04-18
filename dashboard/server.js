import express from 'express';
import supabase from '../services/db.js';
import 'dotenv/config';

const app = express();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(express.json());
app.use(express.static('public'));

// ==============================
// SIMPLE AUTH MIDDLEWARE
// ==============================
app.use((req, res, next) => {
  const pass = req.headers['x-admin-pass'];

  if (!ADMIN_PASSWORD) {
    return res.status(500).send('Missing ADMIN_PASSWORD');
  }

  // Allow static files (frontend)
  if (!req.path.startsWith('/api')) return next();

  if (pass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
});

// ==============================
// GET ALL LICENSES
// ==============================
app.get('/api/licenses', async (req, res) => {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .order('usedAt', { ascending: false });

  if (error) return res.status(500).json(error);

  res.json(data);
});

// ==============================
// REVOKE LICENSE
// ==============================
app.post('/api/revoke', async (req, res) => {
  const { key } = req.body;

  const { error } = await supabase
    .from('licenses')
    .update({
      expired: true,
      expiresAt: Date.now()
    })
    .eq('key', key);

  if (error) return res.status(500).json(error);

  res.json({ success: true });
});

// ==============================
// START SERVER
// ==============================
app.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Dashboard running on port ${process.env.PORT || 3000}`);
});
