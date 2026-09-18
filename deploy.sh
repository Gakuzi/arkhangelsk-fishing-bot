#!/bin/bash
set -e

echo "🚀 Сохранение локальных изменений и обновление репозитория..."
git stash || true
git pull origin main

echo "📦 Сборка фронтенда и бэкенда..."
npm install
npm run build

echo "🐍 Проверка виртуального окружения Python..."
if [ ! -d "venv" ]; then
  python3 -m venv venv 2>/dev/null || true
fi
if [ -f "venv/bin/pip" ]; then
  ./venv/bin/pip install -q -r requirements.txt 2>/dev/null || true
fi

echo "⚙️ Обновление службы systemd..."
if [ -f deploy/fishing_bot.service ]; then
  cp deploy/fishing_bot.service /etc/systemd/system/fishing_bot.service
  systemctl daemon-reload
fi

echo "🔄 Перезапуск службы..."
systemctl restart fishing_bot.service

# Удаляем дублирующий fishing-app из PM2, чтобы устранить конфликт портов и 100% CPU
if command -v pm2 &> /dev/null; then
  pm2 delete fishing-app 2>/dev/null || true
  pm2 restart fishing-bot 2>/dev/null || true
  pm2 save 2>/dev/null || true
fi

echo "✅ Деплой успешно завершён! Служба работает на порту 3005."

