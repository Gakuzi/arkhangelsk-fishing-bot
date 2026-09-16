#!/usr/bin/env bash
# Runner for Fishing Telegram Bot with automatic venv detection
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f "$SCRIPT_DIR/venv/bin/python" ]; then
  echo "[Bot Runner] Using local virtualenv: $SCRIPT_DIR/venv/bin/python"
  exec "$SCRIPT_DIR/venv/bin/python" bot.py
elif [ -f "/root/fishing_bot/venv/bin/python" ]; then
  echo "[Bot Runner] Using /root/fishing_bot/venv/bin/python"
  exec "/root/fishing_bot/venv/bin/python" bot.py
elif [ -f "$SCRIPT_DIR/../venv/bin/python" ]; then
  echo "[Bot Runner] Using parent virtualenv: $SCRIPT_DIR/../venv/bin/python"
  exec "$SCRIPT_DIR/../venv/bin/python" bot.py
elif command -v python3 &> /dev/null; then
  echo "[Bot Runner] Using system python3"
  exec python3 bot.py
else
  echo "[Bot Runner] Using default python"
  exec python bot.py
fi
