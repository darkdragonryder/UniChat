#!/bin/bash
set -e

cd /home/opc/UniChat

echo "🔄 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🚀 Restarting UniChat with PM2..."
pm2 restart ecosystem.config.cjs

echo "✅ Deploy complete!"
echo ""
echo "Check logs: pm2 logs unichat --lines 20"
