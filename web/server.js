import express from 'express';
import cors from 'cors';
import { supabase } from '../db/supabase.js';
import { validateLicense } from '../api/licenseAPI.js';

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// HEALTH CHECK
// ==============================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: 'v9' });
});

// ==============================
// LICENSE VALIDATION (FOR APPS)
// ==============================
app.post('/api/license/validate', async (req, res) => {

  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ valid: false, error: 'Missing key' });
  }

  const result = await validateLicense(key);

  res.json(result);
});

// ==============================
// GET ALL LICENSES (ADMIN PANEL)
// ==============================
app.get('/api/admin/licenses', async (req, res) => {

  const { data, error } = await supabase
    .from('licenses')
    .select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ==============================
// GET ALL GUILDS
// ==============================
app.get('/api/admin/guilds', async (req, res) => {

  const { data, error } = await supabase
    .from('guild_setup')
    .select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ==============================
// GET AUDIT LOGS (V6)
// ==============================
app.get('/api/admin/audit', async (req, res) => {

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 Web API running on port ${PORT}`);
});
