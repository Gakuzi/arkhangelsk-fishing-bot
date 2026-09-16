# Поморский Рыболовный Бот и Telegram Mini App (Архангельск)

Полнофункциональный комплекс: **Telegram-бот (Python aiogram 3)** и **визуальное Telegram Mini App / WebApp (React 18 + TypeScript + Tailwind CSS)** для рыбаков Архангельска, дельты Северной Двины, Сухого и Белого Морей.

---

## 🌊 Возможности системы

1. **Telegram Mini App (Web-интерфейс в клиенте Telegram)**:
   - Запуск внутри Telegram на смартфонах (iOS / Android) и на ПК (Telegram Desktop / Web).
   - **Личные кабинеты рыбаков**: настройка профиля, опыт, техника (снегоход, буксировщик, лодка ПВХ), район, снасти, статистика уловов и трофеев.
   - **Запланированные рыбалки**: организация экспедиций, набор экипажа с лимитом мест, чек-листы и геоточки сбора.
   - **История рыбалок и дневник уловов**: детальный учет пойманной рыбы (штуки, вес в кг, трофейные отметки), снастей и наживок, отзывы и рейтинг клева.
   - **Интерактивная карта точек лова**: каталог GPS-координат (Мудьюг, Сухое Море, Ягры, Маймакса), радарная схема и экспорт в навигаторы.
   - **Нативная интеграция Telegram SDK**:
     - `Telegram.WebApp.ready()` и `expand()` (раскрытие на весь экран);
     - Нативная кнопка `BackButton` (возврат на главный экран);
     - `sendData` (мгновенная передача данных из приложения в чат бота);
     - `HapticFeedback` (тактильный отклик при действиях);
     - Автоопределение пользователя Telegram через `initDataUnsafe.user`.

2. **Telegram Bot (aiogram 3, Python)**:
   - Автоматическая установка кнопки **«🎣 Меню Рыбака»** (`MenuButtonWebApp`) рядом со строкой ввода сообщений.
   - Обработка команд: `/start`, `/app`, `/trips`, `/spots`, `/profile`, `/help`.
   - Обработка входящих данных из Mini App (`F.web_app_data`).
   - Прием геолокаций с автоматическим добавлением точек в базу.
   - Групповой режим: реакция `👀`, Spark-синхронизация, голосование экипажа.

---

## 🚀 Настройка в Telegram (@BotFather)

### Шаг 1: Получение токена бота
1. Откройте диалог с **[@BotFather](https://t.me/BotFather)**.
2. Введите команду `/newbot` и следуйте подсказкам (задайте имя и username).
3. Скопируйте полученный **API Token** и вставьте в `.env` файл (`TELEGRAM_BOT_TOKEN`).

### Шаг 2: Настройка кнопки Mini App (Menu Button)
Чтобы в чате с ботом слева от строки ввода всегда была кнопка вызова приложения:
1. В @BotFather отправьте команду:
   ```
   /setmenubutton
   ```
2. Выберите вашего бота.
3. Отправьте HTTPS-ссылку на ваше приложение (например, `https://your-domain.ru`).
4. Введите название кнопки, например: `🎣 Открыть приложение` или `🌊 Рыбалка`.

*Примечание: в файле `bot.py` бот также автоматически регистрирует эту кнопку при каждом запуске через API `set_chat_menu_button`.*

### Шаг 3: Регистрация прямого Mini App (Short Name / Direct Link)
Чтобы пользователи могли запускать Mini App по прямой ссылке вида `t.me/botusername/app`:
1. В @BotFather отправьте команду:
   ```
   /newapp
   ```
2. Выберите вашего бота.
3. Укажите название: `Поморский Рыболов`.
4. Введите краткое описание (например, *«Личный кабинет рыбака, выезды экипажей и уловы в Архангельске»*).
5. Загрузите иконку 640x360 px (или пропустите `/empty`).
6. Отправьте URL приложения: `https://your-domain.ru`.
7. Придумайте короткое имя (short name), например: `app` или `fishing`.
8. Теперь ваше приложение доступно по ссылке: `https://t.me/<ваш_бот>/app`!

---

## 🛠 Запуск и публикация на VPS

### 1. Переменные окружения (`.env`)
Создайте файл `.env` в корне проекта:
```env
TELEGRAM_BOT_TOKEN=1234567890:AAHxxxxxx...
TELEGRAM_CHAT_ID=-100xxxxxxxxxx
WEBAPP_URL=https://your-domain.ru
```

### 2. Запуск Web-приложения (Node.js + Vite + Express)
```bash
# Установка зависимостей
npm install

# Сборка production версии
npm run build

# Запуск приложения (порт 3000)
npm run start
```

Для непрерывной работы в фоне используйте **PM2**:
```bash
npm install -g pm2
pm2 start dist/server.cjs --name "fishing-webapp"
pm2 save
```

### 3. Запуск Telegram-бота (Python aiogram)
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Запуск бота
python3 bot.py
```

Для фоновой работы бота через **PM2**:
```bash
pm2 start "python3 bot.py" --name "fishing-bot"
```

### 4. Настройка Nginx и SSL (HTTPS обязателен для Telegram WebApp)
Telegram Mini Apps требуют **валидный SSL-сертификат (HTTPS)**.

Конфигурация `/etc/nginx/sites-available/fishing`:
```nginx
server {
    server_name your-domain.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Выпуск бесплатного SSL-сертификата Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.ru
```

## Настройка Inline-режима
Для работы инлайн-режима бота (возможность вызывать бота через @bot_name в любом чате), необходимо включить эту функцию через BotFather:
1. Откройте @BotFather в Telegram.
2. Отправьте команду `/setinline`.
3. Выберите вашего бота.
4. Введите текст-подсказку (например, `Поиск...`).
