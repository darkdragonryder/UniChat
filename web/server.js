import express from 'express';
import cors from 'cors';

import { requireAuth } from './auth.js';
import { supabase } from '../db/supabase.js';
import { validateLicense } from '../api/licenseAPI.js';

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// HEALTH CHECK
// =========================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: 'v10' });
});

// =========================
// LICENSE VALIDATION (PUBLIC)
// =========================
app.post('/api/license/validate', async (req, res) => {

  const { key } = req.body;

  const result = await validateLicense(key);

  res.json(result);
});

// =========================
// ADMIN: GET LICENSES
// =========================
app.get('/api/admin/licenses', requireAuth, async (req, res) => {

  const { data, error } = await supabase
    .from('licenses')
    .select('*');

  if (error) return res.status(500).json(error);

  res.json(data);
});

// =========================
// ADMIN: GET GUILDS
// =========================
app.get('/api/admin/guilds', requireAuth, async (req, res) => {

  const { data, error } = await supabase
    .from('guild_setup')
    .select('*');

  if (error) return res.status(500).json(error);

  res.json(data);
});

// =========================
// ADMIN: ANALYTICS
// =========================
app.get('/api/admin/analytics', requireAuth, async (req, res) => {

  const { data: licenses } = await supabase.from('licenses').select('*');
  const { data: guilds } = await supabase.from('guild_setup').select('*');

  const active = licenses.filter(l => l.used).length;
  const expired = licenses.filter(l => l.expires_at && new Date(l.expires_at) < new Date()).length;

  res.json({
    totalLicenses: licenses.length,
    activeLicenses: active,
    expiredLicenses: expired,
    totalGuilds: guilds.length,
    premiumGuilds: guilds.filter(g => g.premium).length
  });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 V10 Web Dashboard running on ${PORT}`);
});
