import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface LogEntry {
  id: string;
  timestamp: string;
  role: string;
  text: string;
  type?: 'text' | 'location' | 'vote' | 'system';
}

interface FishingSpot {
  id: string;
  user: string;
  lat: number;
  lon: number;
  name?: string;
  timestamp: string;
  areaDescription?: string;
}

interface CrewMember {
  id: string;
  user: string;
  vote: 'yes' | 'no';
  timestamp: string;
}

interface SparkCommand {
  id: string;
  method: string;
  payload: Record<string, any>;
  createdAt: string;
  status: 'pending' | 'delivered';
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8666462902:AAFhIMmwQtk0KmN_iM60PAEfsWBCvS0OYhw';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1004386693265';
const LOG_DOC_ID = process.env.LOG_DOC_ID || '1hs2ZbXq-6Ijc4z4g0KyilkMnwZ63b6l0e3D6tobACFU';
const QUEUE_DOC_ID = process.env.QUEUE_DOC_ID || '1j_2ta_pQPH2kuETaRPBJkU6QCRkVzQNgxV7Ql6PBUdA';

// In-memory data store for server session
const logs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '14.09 07:30',
    role: 'Алексей',
    text: 'На Сухом море в районе о. Мудьюг с утра корюшка и навага берут активно!',
    type: 'text'
  },
  {
    id: 'log-2',
    timestamp: '14.09 08:15',
    role: 'Михаил',
    text: '📍 Прислал точку на карте: 64.8564, 40.2812',
    type: 'location'
  },
  {
    id: 'log-3',
    timestamp: '14.09 09:00',
    role: 'ГОЛОСОВАНИЕ',
    text: 'Дмитрий -> ИДЕТ',
    type: 'vote'
  },
  {
    id: 'log-4',
    timestamp: '14.09 09:20',
    role: 'СИСТЕМА',
    text: 'Иван запросил меню отправки точки.',
    type: 'system'
  }
];

const spots: FishingSpot[] = [
  {
    id: 'spot-1',
    user: 'Михаил',
    lat: 64.8564,
    lon: 40.2812,
    name: 'Остров Мудьюг / Сухое море',
    areaDescription: 'Зимний/осенний лов наваги и корюшки, глубина 4-6м',
    timestamp: '14.09 08:15'
  },
  {
    id: 'spot-2',
    user: 'Евгений',
    lat: 64.5381,
    lon: 40.5234,
    name: 'Маймаксанский рукав',
    areaDescription: 'Окунь, щука вдоль береговой бровки',
    timestamp: '14.09 10:45'
  },
  {
    id: 'spot-3',
    user: 'Сергей',
    lat: 64.6012,
    lon: 39.8450,
    name: 'Остров Ягры (Северодвинск / губа)',
    areaDescription: 'Камбала, сиг на отливе',
    timestamp: '13.09 16:20'
  }
];

const crew: CrewMember[] = [
  { id: 'c-1', user: 'Дмитрий', vote: 'yes', timestamp: '14.09 09:00' },
  { id: 'c-2', user: 'Алексей', vote: 'yes', timestamp: '14.09 09:10' },
  { id: 'c-3', user: 'Владимир', vote: 'no', timestamp: '14.09 10:05' },
  { id: 'c-4', user: 'Иван', vote: 'yes', timestamp: '14.09 11:30' }
];

const queue: SparkCommand[] = [
  {
    id: 'q-1',
    method: 'sendMessage',
    payload: {
      chat_id: TELEGRAM_CHAT_ID,
      text: '🎣 Внимание экипажу! Сбор в субботу в 05:30 на причале.',
      parse_mode: 'HTML'
    },
    createdAt: '14.09 11:00',
    status: 'delivered'
  }
];

function logToDoc(role: string, text: string, type: 'text' | 'location' | 'vote' | 'system' = 'text') {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const newEntry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: timeStr,
    role,
    text,
    type
  };
  logs.unshift(newEntry);
  console.log(`[LOG ${timeStr}] ${role}: ${text}`);
  return newEntry;
}

// Telegram helper to safely make requests if token is available
async function callTelegramApi(method: string, payload: Record<string, any>) {
  if (!TELEGRAM_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API error on ${method}:`, err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'arkhangelsk-fishing-bot' });
  });

  app.get('/api/config', (req: Request, res: Response) => {
    const maskedToken = TELEGRAM_TOKEN
      ? `${TELEGRAM_TOKEN.slice(0, 5)}...${TELEGRAM_TOKEN.slice(-4)}`
      : 'Not configured';
    res.json({
      hasToken: Boolean(TELEGRAM_TOKEN),
      tokenMasked: maskedToken,
      chatId: TELEGRAM_CHAT_ID,
      logDocId: LOG_DOC_ID,
      queueDocId: QUEUE_DOC_ID,
      botUsername: 'ArkhangelskFishingBot'
    });
  });

  app.get('/api/logs', (req: Request, res: Response) => {
    res.json(logs);
  });

  app.post('/api/logs', (req: Request, res: Response) => {
    const { role, text, type } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const entry = logToDoc(role || 'Пользователь', text, type || 'text');
    res.status(201).json(entry);
  });

  app.get('/api/spots', (req: Request, res: Response) => {
    res.json(spots);
  });

  app.post('/api/spots', (req: Request, res: Response) => {
    const { user, lat, lon, name, areaDescription } = req.body;
    if (lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newSpot: FishingSpot = {
      id: `spot-${Date.now()}`,
      user: user || 'Рыбак',
      lat: Number(lat),
      lon: Number(lon),
      name: name || `Точка ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      timestamp: timeStr,
      areaDescription: areaDescription || 'Перспективное место лова'
    };

    spots.unshift(newSpot);
    logToDoc(newSpot.user, `📍 Прислал точку на карте: ${lat}, ${lon}`, 'location');

    res.status(201).json({
      spot: newSpot,
      botReply: `📍 <b>${newSpot.user}</b>, точка принята!\nКоординаты: <code>${lat}, ${lon}</code>\n<i>Spark учтет этот квадрат.</i>`
    });
  });

  app.get('/api/crew', (req: Request, res: Response) => {
    res.json(crew);
  });

  app.post('/api/crew/vote', (req: Request, res: Response) => {
    const { user, action } = req.body; // action: 'vote_yes' | 'vote_no'
    if (!user || !action) {
      return res.status(400).json({ error: 'User and action are required' });
    }

    const vote = action === 'vote_yes' ? 'yes' : 'no';
    const voteText = vote === 'yes' ? 'ИДЕТ' : 'НЕ ИДЕТ';

    logToDoc('ГОЛОСОВАНИЕ', `${user} -> ${voteText}`, 'vote');

    const existingIndex = crew.findIndex(c => c.user.toLowerCase() === user.toLowerCase());
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    if (existingIndex >= 0) {
      crew[existingIndex].vote = vote;
      crew[existingIndex].timestamp = timeStr;
    } else {
      crew.push({
        id: `c-${Date.now()}`,
        user,
        vote,
        timestamp: timeStr
      });
    }

    const reply = vote === 'yes'
      ? `🔥 <b>${user}</b>, зафиксировано! Вы в экипаже.`
      : `🫡 <b>${user}</b>, отказ зафиксирован.`;

    res.json({ crew, reply });
  });

  app.get('/api/queue', (req: Request, res: Response) => {
    res.json(queue);
  });

  app.post('/api/queue', (req: Request, res: Response) => {
    const { method, payload } = req.body;
    const newCmd: SparkCommand = {
      id: `q-${Date.now()}`,
      method: method || 'sendMessage',
      payload: payload || { text: 'Привет из Spark' },
      createdAt: new Date().toLocaleTimeString('ru-RU'),
      status: 'pending'
    };
    queue.unshift(newCmd);
    res.status(201).json(newCmd);
  });

  // Simulator route replicating Python bot message processing
  app.post('/api/bot/simulate', async (req: Request, res: Response) => {
    const { messageType, text, location, user, action, isGroup } = req.body;
    const author = user || 'Рыбак_Архангельск';

    // 1. Callback query processing
    if (messageType === 'callback') {
      if (action === 'btn_spots') {
        logToDoc('СИСТЕМА', `${author} запросил меню отправки точки.`, 'system');
        if (isGroup) {
          return res.json({
            reply: `🗺 <b>${author}</b>, отправка точных координат работает в личных сообщениях боту, чтобы другие участники не видели лишнего.\n\n👉 Перейдите в диалог с ботом и нажмите кнопку ниже:`,
            parse_mode: 'HTML',
            buttons: [{ text: '📍 Отправить точку в ЛС', url: `https://t.me/ArkhangelskFishingBot` }]
          });
        } else {
          return res.json({
            reply: `🗺 Нажмите кнопку ниже, чтобы отправить координаты:`,
            reply_markup: 'request_location'
          });
        }
      } else if (action === 'vote_yes' || action === 'vote_no') {
        const vote = action === 'vote_yes' ? 'yes' : 'no';
        const voteText = vote === 'yes' ? 'ИДЕТ' : 'НЕ ИДЕТ';
        logToDoc('ГОЛОСОВАНИЕ', `${author} -> ${voteText}`, 'vote');

        const existing = crew.findIndex(c => c.user.toLowerCase() === author.toLowerCase());
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        if (existing >= 0) {
          crew[existing].vote = vote;
          crew[existing].timestamp = timeStr;
        } else {
          crew.push({ id: `c-${Date.now()}`, user: author, vote, timestamp: timeStr });
        }

        const reply = action === 'vote_yes'
          ? `🔥 <b>${author}</b>, зафиксировано! Вы в экипаже.`
          : `🫡 <b>${author}</b>, отказ зафиксирован.`;

        return res.json({ reply, parse_mode: 'HTML' });
      }
    }

    // 2. Location message processing
    if (messageType === 'location' && location) {
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);
      logToDoc(author, `📍 Прислал точку на карте: ${lat}, ${lon}`, 'location');

      spots.unshift({
        id: `spot-${Date.now()}`,
        user: author,
        lat,
        lon,
        name: location.name || `Точка в районе Архангельска (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      });

      return res.json({
        reply: `📍 <b>${author}</b>, точка принята!\nКоординаты: <code>${lat}, ${lon}</code>\n<i>Spark учтет этот квадрат.</i>`,
        parse_mode: 'HTML'
      });
    }

    // 3. Text message processing
    if (text) {
      logToDoc(author, text, 'text');
      return res.json({
        reaction: '👀',
        reply: `<i>✍️ Записано в журнал.\n⏱ Spark проверит переписку через ~30 мин.</i>`,
        parse_mode: 'HTML'
      });
    }

    res.status(400).json({ error: 'Invalid message simulation request' });
  });

  // Telegram webhook receiver
  app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
    const update = req.body;
    console.log('Received Telegram update:', JSON.stringify(update));

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const user = msg.from?.first_name || 'Рыбак';

      if (msg.location) {
        const { latitude: lat, longitude: lon } = msg.location;
        logToDoc(user, `📍 Прислал точку на карте: ${lat}, ${lon}`, 'location');
        spots.unshift({
          id: `spot-${Date.now()}`,
          user,
          lat,
          lon,
          name: `Точка (${lat}, ${lon})`,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
        await callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: `📍 <b>${user}</b>, точка принята!\nКоординаты: <code>${lat}, ${lon}</code>\n<i>Spark учтет этот квадрат.</i>`,
          parse_mode: 'HTML'
        });
      } else if (msg.text) {
        logToDoc(user, msg.text, 'text');
        // Add reaction if supported
        await callTelegramApi('setMessageReaction', {
          chat_id: chatId,
          message_id: msg.message_id,
          reaction: [{ type: 'emoji', emoji: '👀' }]
        });
        await callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: `<i>✍️ Записано в журнал.\n⏱ Spark проверит переписку через ~30 мин.</i>`,
          parse_mode: 'HTML'
        });
      }
    } else if (update.callback_query) {
      const call = update.callback_query;
      const user = call.from?.first_name || 'Рыбак';
      const action = call.data;
      const chatId = call.message?.chat?.id;

      await callTelegramApi('answerCallbackQuery', { callback_query_id: call.id });

      if (action === 'btn_spots') {
        logToDoc('СИСТЕМА', `${user} запросил меню отправки точки.`, 'system');
        await callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: `🗺 <b>${user}</b>, отправка точных координат работает в личных сообщениях боту.\n👉 Нажмите кнопку:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '📍 Отправить точку в ЛС', url: `https://t.me/ArkhangelskFishingBot` }]]
          }
        });
      } else if (action === 'vote_yes' || action === 'vote_no') {
        const voteText = action === 'vote_yes' ? 'ИДЕТ' : 'НЕ ИДЕТ';
        logToDoc('ГОЛОСОВАНИЕ', `${user} -> ${voteText}`, 'vote');
        const reply = action === 'vote_yes'
          ? `🔥 <b>${user}</b>, зафиксировано! Вы в экипаже.`
          : `🫡 <b>${user}</b>, отказ зафиксирован.`;
        await callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: reply,
          parse_mode: 'HTML'
        });
      }
    }

    res.json({ ok: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arkhangelsk Fishing Bot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
