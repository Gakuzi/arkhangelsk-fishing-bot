#!/usr/bin/env bash
set -e

echo "=== [Fishing App & Bot Auto-Deploy] Starting update ==="
date

# 1. Pull latest changes from git
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "📥 Pulling latest git commits..."
  git pull origin $(git rev-parse --abbrev-ref HEAD) || git pull || true
else
  echo "⚠️ Not a git working tree, skipping git pull."
fi

# 2. Install Node.js dependencies if needed
echo "📦 Checking Node.js dependencies..."
npm install --no-audit --prefer-offline 2>/dev/null || npm install

# 3. Install Python dependencies if needed
if [ -f requirements.txt ]; then
  echo "🐍 Checking Python dependencies..."
  pip3 install -r requirements.txt --quiet 2>/dev/null || pip install -r requirements.txt --quiet 2>/dev/null || true
fi

# 4. Build production WebApp assets
echo "🔨 Building frontend web assets..."
npm run build

# 5. Reload / restart PM2 for both WebApp and Bot
echo "🚀 Reloading services in PM2..."
if command -v pm2 &> /dev/null; then
  if [ -f ecosystem.config.cjs ]; then
    pm2 startOrReload ecosystem.config.cjs --update-env
  else
    pm2 reload fishing-app || pm2 restart fishing-app || true
    pm2 reload fishing-bot || pm2 restart fishing-bot || true
  fi
  pm2 save || true
  echo "✅ PM2 processes reloaded:"
  pm2 status
else
  echo "⚠️ PM2 is not installed globally or not in PATH."
fi

echo "=== [Fishing App & Bot Auto-Deploy] Successfully Completed ==="
