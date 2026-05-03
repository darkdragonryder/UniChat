#!/bin/bash
cd /home/opc/UniChat
git pull
npm install
pm2 restart unichat
