import express from 'express';
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

import { getGuildSetup } from '../services/guildSetupStore.js';
import { isLicenseActive } from '../services/licenseStore.js';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

// ==============================
// DISCORD BOT CLIENT (READ-ONLY)
// ==============================
const bot = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// login bot (read-only usage)
bot.login(process.env.TOKEN);

// ==============================
// BASIC MIDDLEWARE
// ==============================
app.use(express.json());
app.use(express.static('public'));

// ==============================
// GET ALL GUILDS
// ==============================
app.get('/api/guilds', async (req, res) => {
  try {
    const guilds = [];

    for (const guild of bot.guilds.cache.values()) {

      const premium = await isLicenseActive(guild.id);
      const setup = await getGuildSetup(guild.id);

      guilds.push({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
        premium,
        setup: !!setup
      });
    }

    res.json({
      success: true,
      guilds
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'failed to load guilds' });
  }
});

// ==============================
// GET SINGLE GUILD DETAILS
// ==============================
app.get('/api/guild/:id', async (req, res) => {
  try {
    const guild = bot.guilds.cache.get(req.params.id);

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const premium = await isLicenseActive(guild.id);
    const setup = await getGuildSetup(guild.id);

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      members: guild.memberCount,
      premium,
      setup
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'failed' });
  }
});

// ==============================
// EXTEND PREMIUM (HOOK READY)
// ==============================
app.post('/api/guild/:id/extend', async (req, res) => {
  try {
    // placeholder for your license extension system
    const guildId = req.params.id;

    console.log(`Extend request for ${guildId}`);

    res.json({
      success: true,
      message: 'Extension hook ready (connect license system here)'
    });

  } catch (err) {
    res.status(500).json({ error: 'failed' });
  }
});

// ==============================
// REVOKE PREMIUM (HOOK READY)
// ==============================
app.post('/api/guild/:id/revoke', async (req, res) => {
  try {
    const guildId = req.params.id;

    console.log(`Revoke request for ${guildId}`);

    res.json({
      success: true,
      message: 'Revoke hook ready (connect license system here)'
    });

  } catch (err) {
    res.status(500).json({ error: 'failed' });
  }
});

// ==============================
// START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`🌐 Dashboard running on http://localhost:${PORT}`);
});
