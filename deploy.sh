#!/bin/bash
git pull origin main
npm install
npm run build
sudo systemctl restart fishing_bot.service
