import express from 'express';
import session from 'express-session';
import axios from 'axios';
import 'dotenv/config';

import { Client, GatewayIntentBits } from 'discord.js';

import {
  isLicenseActive,
  revokeLicense,
  extendLicense
} from '../services/licenseStore.js';

import { getGuildSetup } from '../services/guildSetupStore.js';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

// ==============================
// DISCORD BOT CLIENT
// ==============================
const bot = new Client({
  intents: [GatewayIntentBits.Guilds]
});

bot.login(process.env.TOKEN);

// ==============================
// SESSION SYSTEM
// ==============================
app.use(session({
  secret: process.env.SESSION_SECRET || 'unichat-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.json());
app.use(express.static('public'));

// ==============================
// DISCORD OAUTH CONFIG
// ==============================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// ==============================
// LOGIN ROUTE
// ==============================
app.get('/login', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify%20guilds`;

  res.redirect(url);
});

// ==============================
// CALLBACK
// ==============================
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.send("No code provided");

  try {
    // exchange code for token
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const accessToken = tokenRes.data.access_token;

    // get user info
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    req.session.user = userRes.data;
    req.session.guilds = guildsRes.data;

    res.redirect('/');

  } catch (err) {
    console.log(err);
    res.send("OAuth failed");
  }
});

// ==============================
// CHECK AUTH
// ==============================
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// ==============================
// GUILDS API (USER FILTERED)
// ==============================
app.get('/api/guilds', requireLogin, async (req, res) => {
  const userGuilds = req.session.guilds;

  const botGuilds = [];

  for (const guild of bot.guilds.cache.values()) {

    const match = userGuilds.find(g => g.id === guild.id);
    if (!match) continue;

    const setup = await getGuildSetup(guild.id);

    botGuilds.push({
      id: guild.id,
      name: guild.name,
      members: guild.memberCount,
      owner: match.owner,
      premium: await isLicenseActive(guild.id),
      setup: !!setup
    });
  }

  res.json({ guilds: botGuilds });
});

// ==============================
// EXTEND
// ==============================
app.post('/api/guild/:id/extend', requireLogin, async (req, res) => {
  try {
    const { days } = req.body;
    await extendLicense(req.params.id, days);

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'extend failed' });
  }
});

// ==============================
// REVOKE
// ==============================
app.post('/api/guild/:id/revoke', requireLogin, async (req, res) => {
  try {
    await revokeLicense(req.params.id);

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'revoke failed' });
  }
});

// ==============================
// START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`🌐 Dashboard running on http://localhost:${PORT}`);
});
