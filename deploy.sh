#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🚀 [1/5] Обновление репозитория..."
git stash || true
git pull origin main || git pull || true

echo "📦 [2/5] Сборка фронтенда и бэкенда WebApp..."
npm install
npm run build

echo "🐍 [3/5] Проверка виртуального окружения Python..."
if [ ! -d "venv" ]; then
  python3 -m venv venv 2>/dev/null || true
fi
if [ -f "venv/bin/pip" ]; then
  ./venv/bin/pip install -r requirements.txt
else
  pip3 install -r requirements.txt 2>/dev/null || true
fi

echo "⚙️ [4/5] Перезапуск веб-сервера (systemd)..."
if [ -f deploy/fishing_bot.service ]; then
  cp deploy/fishing_bot.service /etc/systemd/system/fishing_bot.service 2>/dev/null || true
  systemctl daemon-reload 2>/dev/null || true
  systemctl restart fishing_bot.service 2>/dev/null || true
  systemctl enable fishing_bot.service 2>/dev/null || true
fi

echo "🤖 [5/5] Перезапуск Telegram-бота..."
# Останавливаем старые/зависшие процессы python bot.py во избежание конфликта Telegram polling
pkill -f "python.*bot.py" 2>/dev/null || true

if command -v pm2 &> /dev/null; then
  pm2 delete fishing-app 2>/dev/null || true
  pm2 delete fishing-bot 2>/dev/null || true
  pm2 start ecosystem.config.cjs
  pm2 save 2>/dev/null || true
  pm2 status
else
  chmod +x run_bot.sh
  nohup ./run_bot.sh > bot.log 2>&1 &
  echo "Бот запущен в фоне (PID: $!)"
fi

echo "✅ Деплой и перезапуск успешно завершены!"


