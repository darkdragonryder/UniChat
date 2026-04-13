import express from 'express';
import fs from 'fs';
import { getStats } from '../utils/stats.js';

const app = express();
app.use(express.json());
app.use(express.static('dashboard/public'));

app.get('/stats', (req, res) => {
  res.json(getStats());
});

app.post('/access', (req, res) => {
  const config = JSON.parse(fs.readFileSync('./config.json'));
  config.allowedUsers.push(req.body.user);
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
  res.send("OK");
});

app.listen(3000, () => console.log("🌍 Dashboard running"));