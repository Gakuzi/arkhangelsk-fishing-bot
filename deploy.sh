#!/usr/bin/env bash
set -e

echo "=== [Fishing App Auto-Deploy] Starting update ==="
date

# 1. Pull latest changes from git
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Pulling latest git commits..."
  git pull origin $(git rev-parse --abbrev-ref HEAD) || git pull || true
else
  echo "Not a git working tree, skipping git pull."
fi

# 2. Build production assets
echo "Building project..."
npm run build

# 3. Reload / restart PM2
echo "Restarting service in PM2..."
if command -v pm2 &> /dev/null; then
  if pm2 describe fishing-app > /dev/null 2>&1; then
    pm2 reload fishing-app || pm2 restart fishing-app
  elif [ -f ecosystem.config.cjs ]; then
    pm2 startOrReload ecosystem.config.cjs
  else
    pm2 restart all || true
  fi
  echo "PM2 process reloaded."
else
  echo "PM2 is not installed globally or not in PATH."
fi

echo "=== [Fishing App Auto-Deploy] Complete ==="
