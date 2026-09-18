#!/bin/bash
set -e

echo "🚀 Обновление репозитория..."
git pull origin main

echo "📦 Сборка фронтенда и бэкенда..."
npm install
npm run build

echo "⚙️ Обновление службы systemd..."
if [ -f deploy/fishing_bot.service ]; then
  cp deploy/fishing_bot.service /etc/systemd/system/fishing_bot.service
  systemctl daemon-reload
fi

echo "🔄 Перезапуск службы..."
systemctl restart fishing_bot.service
echo "✅ Деплой успешно завершён! Служба перезапущена на порту 3005."

