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

echo "⚙️ [4/5] Настройка и запуск веб-сервера..."
CUR_DIR="$(pwd)"
NODE_BIN="$(which node || echo '/usr/bin/node')"

if [ -f deploy/fishing_bot.service ]; then
  # Адаптируем пути в unit-файле под текущую папку и бинарник node
  sed -i "s|WorkingDirectory=.*|WorkingDirectory=${CUR_DIR}|g" deploy/fishing_bot.service
  sed -i "s|EnvironmentFile=-.*|EnvironmentFile=-${CUR_DIR}/.env|g" deploy/fishing_bot.service
  sed -i "s|ExecStart=.*|ExecStart=${NODE_BIN} dist/server.cjs|g" deploy/fishing_bot.service
  
  cp deploy/fishing_bot.service /etc/systemd/system/fishing_bot.service 2>/dev/null || true
  systemctl daemon-reload 2>/dev/null || true
  systemctl enable fishing_bot.service 2>/dev/null || true
  systemctl restart fishing_bot.service 2>/dev/null || true
fi

# Проверяем, запустилась ли служба через systemd
sleep 2
WEB_ACTIVE=false
if systemctl is-active --quiet fishing_bot.service 2>/dev/null; then
  echo "✅ Служба fishing_bot.service активна в systemd"
  WEB_ACTIVE=true
else
  echo "⚠️ systemd-служба не запустилась, поднимаем веб-сервер через PM2..."
  if command -v pm2 &> /dev/null; then
    pm2 delete fishing-app 2>/dev/null || true
    pm2 start dist/server.cjs --name "fishing-app"
    WEB_ACTIVE=true
  fi
fi

# Проверяем доступность веб-сервера локально
HEALTH_OK=false
if curl -s -f http://127.0.0.1:3000/api/health >/dev/null 2>&1 || curl -s -f http://127.0.0.1:3005/api/health >/dev/null 2>&1; then
  echo "✅ Веб-сервер успешно отвечает на запросы (200 OK)!"
  HEALTH_OK=true
else
  echo "⚠️ Внимание: веб-сервер не ответил на /api/health. Проверьте: journalctl -u fishing_bot.service -n 20"
fi

echo "🤖 [5/5] Перезапуск Telegram-бота..."
# Останавливаем старые/зависшие процессы python bot.py во избежание конфликта Telegram polling
pkill -f "python.*bot.py" 2>/dev/null || true

if command -v pm2 &> /dev/null; then
  if systemctl is-active --quiet fishing_bot.service 2>/dev/null; then
    pm2 delete fishing-app 2>/dev/null || true
  fi
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


