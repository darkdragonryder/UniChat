import express from 'express';
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
app.use(express.json());
app.use(express.static('public'));

// ==============================
// ALL GUILDS
// ==============================
app.get('/api/guilds', async (req, res) => {
  const guilds = [];

  for (const guild of bot.guilds.cache.values()) {

    guilds.push({
      id: guild.id,
      name: guild.name,
      members: guild.memberCount,
      premium: await isLicenseActive(guild.id),
      setup: !!(await getGuildSetup(guild.id))
    });
  }

  res.json({ guilds });
});

// ==============================
// EXTEND LICENSE (NOW CONNECTED)
// ==============================
app.post('/api/guild/:id/extend', async (req, res) => {
  try {
    const guildId = req.params.id;
    const { days } = req.body;

    await extendLicense(guildId, days);

    res.json({
      success: true,
      message: `Extended by ${days} days`
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'extend failed' });
  }
});

// ==============================
// REVOKE LICENSE (NOW CONNECTED)
// ==============================
app.post('/api/guild/:id/revoke', async (req, res) => {
  try {
    const guildId = req.params.id;

    await revokeLicense(guildId);

    res.json({
      success: true,
      message: 'License revoked'
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'revoke failed' });
  }
});

// ==============================
app.listen(PORT, () => {
  console.log(`🌐 Dashboard running on http://localhost:${PORT}`);
});
