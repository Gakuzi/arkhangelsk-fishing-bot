import { Router, Request, Response } from 'express';
import { storage } from '../storage.ts';
import { telegramBot } from '../telegramBot.ts';
import { config } from '../config.ts';

export const apiRouter = Router();

// Config
apiRouter.get('/config', (req: Request, res: Response) => {
  res.json({
    telegramChatId: config.telegramChatId,
    botUsername: config.botUsername,
    appUrl: config.appUrl,
    hasToken: Boolean(config.telegramToken),
    tokenMasked: config.telegramToken
      ? `${config.telegramToken.slice(0, 5)}...${config.telegramToken.slice(-4)}`
      : 'Not set'
  });
});

// Users & Profiles
apiRouter.get('/users', (req: Request, res: Response) => {
  res.json(storage.getUsers());
});

apiRouter.get('/users/:id', (req: Request, res: Response) => {
  const user = storage.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

apiRouter.put('/users/:id/profile', (req: Request, res: Response) => {
  const updated = storage.updateProfile(req.params.id, req.body);
  res.json(updated);
});

// Planned Trips
apiRouter.get('/trips', (req: Request, res: Response) => {
  res.json(storage.getTrips());
});

apiRouter.post('/trips', (req: Request, res: Response) => {
  const { organizerId, ...tripData } = req.body;
  const organizer = storage.getUserById(organizerId) || storage.getUsers()[0];
  const newTrip = storage.createTrip(tripData, organizer);
  res.status(201).json(newTrip);
});

apiRouter.post('/trips/:id/join', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = storage.getUserById(userId) || storage.getUsers()[0];
  const result = storage.joinTrip(req.params.id, user);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

apiRouter.post('/trips/:id/leave', (req: Request, res: Response) => {
  const { userId } = req.body;
  const result = storage.leaveTrip(req.params.id, userId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Fishing History & Catches
apiRouter.get('/history', (req: Request, res: Response) => {
  res.json(storage.getHistory());
});

apiRouter.post('/history', (req: Request, res: Response) => {
  const entry = req.body;
  if (!entry.location || !entry.catches) {
    return res.status(400).json({ error: 'Location and catches are required' });
  }
  const newEntry = storage.addHistory(entry);
  res.status(201).json(newEntry);
});

// Fishing Spots
apiRouter.get('/spots', (req: Request, res: Response) => {
  res.json(storage.getSpots());
});

apiRouter.post('/spots', (req: Request, res: Response) => {
  const spot = req.body;
  if (spot.lat === undefined || spot.lon === undefined) {
    return res.status(400).json({ error: 'Coordinates are required' });
  }
  const newSpot = storage.addSpot(spot);
  res.status(201).json(newSpot);
});

// Logs & Bot console
apiRouter.get('/logs', (req: Request, res: Response) => {
  res.json(storage.getLogs());
});

apiRouter.post('/logs', (req: Request, res: Response) => {
  const { role, text, type } = req.body;
  const log = storage.addLog(role || 'Пользователь', text, type || 'text');
  res.status(201).json(log);
});

apiRouter.get('/queue', (req: Request, res: Response) => {
  res.json(storage.getQueue());
});

apiRouter.get('/bot/status', (req: Request, res: Response) => {
  res.json(telegramBot.getStatus());
});

apiRouter.post('/bot/simulate', async (req: Request, res: Response) => {
  const response = await telegramBot.simulateMessage(req.body);
  res.json(response);
});

apiRouter.post('/bot/send', async (req: Request, res: Response) => {
  const { text, chatId } = req.body;
  const result = await telegramBot.callApi('sendMessage', {
    chat_id: chatId || config.telegramChatId,
    text: text || 'Тестовое сообщение из панели Arkhangelsk Fishing Bot',
    parse_mode: 'HTML'
  });
  res.json(result);
});

// Webhook
apiRouter.post('/telegram/webhook', async (req: Request, res: Response) => {
  await telegramBot.handleUpdate(req.body);
  res.json({ ok: true });
});
