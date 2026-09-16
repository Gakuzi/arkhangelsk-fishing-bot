import { Router, Request, Response } from 'express';
import { sqliteStorage } from '../sqliteStorage.ts';
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

// Users & Personal Cabinet
apiRouter.get('/telegram-avatar/:userId', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.userId.replace(/^tg-/, '').trim();
    if (!config.telegramToken || !/^\d+$/.test(rawId)) {
      return res.status(404).send('Invalid user ID or no bot token');
    }

    // 1. Fetch user's profile photos via Telegram Bot API
    const photosRes = await fetch(
      `https://api.telegram.org/bot${config.telegramToken}/getUserProfilePhotos?user_id=${rawId}&limit=1`
    );
    const photosData = await photosRes.json();
    if (!photosData.ok || !photosData.result?.photos?.length || !photosData.result.photos[0]?.length) {
      return res.status(404).send('No Telegram profile photo found');
    }

    // Pick highest resolution photo
    const photoSizes = photosData.result.photos[0];
    const bestPhoto = photoSizes[photoSizes.length - 1];

    // 2. Get file path from Telegram
    const fileRes = await fetch(
      `https://api.telegram.org/bot${config.telegramToken}/getFile?file_id=${bestPhoto.file_id}`
    );
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) {
      return res.status(404).send('File not found in Telegram');
    }

    // 3. Download and stream image safely without exposing bot token
    const fileUrl = `https://api.telegram.org/file/bot${config.telegramToken}/${fileData.result.file_path}`;
    const imgRes = await fetch(fileUrl);
    if (!imgRes.ok) {
      return res.status(imgRes.status).send('Failed to fetch image from Telegram CDN');
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hour cache
    const arrayBuffer = await imgRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    return res.status(500).send(err.message);
  }
});

apiRouter.post('/users/sync-telegram', async (req: Request, res: Response) => {
  try {
    const { id, firstName, lastName, username, photoUrl } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }
    const profile = await sqliteStorage.syncTelegramUser({
      telegramId: String(id),
      firstName: firstName || '',
      lastName: lastName || '',
      username: username || '',
      photoUrl: photoUrl || ''
    });
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await sqliteStorage.getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await sqliteStorage.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/users/:id/profile', async (req: Request, res: Response) => {
  try {
    const updated = await sqliteStorage.updateProfile(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User Gear (Снасти)
apiRouter.get('/gear', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'fisherman-1';
    const gear = await sqliteStorage.getGear(userId);
    res.json(gear);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/gear', async (req: Request, res: Response) => {
  try {
    const { userId, name, category, quantity, notes, isReady } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const newGear = await sqliteStorage.addGear({
      userId: userId || 'fisherman-1',
      name,
      category: category || 'Удилища и катушки',
      quantity: quantity ? Number(quantity) : 1,
      notes: notes || '',
      isReady: isReady !== undefined ? Boolean(isReady) : true
    });
    res.status(201).json(newGear);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/gear/:id', async (req: Request, res: Response) => {
  try {
    const updated = await sqliteStorage.updateGear(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Gear not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/gear/:id', async (req: Request, res: Response) => {
  try {
    await sqliteStorage.deleteGear(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Planned Trips
apiRouter.get('/trips', async (req: Request, res: Response) => {
  try {
    const trips = await sqliteStorage.getTrips();
    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/trips', async (req: Request, res: Response) => {
  try {
    const { organizerId, ...tripData } = req.body;
    const users = await sqliteStorage.getUsers();
    const organizer = (organizerId ? await sqliteStorage.getUserById(organizerId) : null) || users[0] || {
      id: organizerId || `user-${Date.now()}`,
      name: tripData.organizerName || 'Организатор',
      telegramUsername: '',
      experienceLevel: 'Любитель',
      fishingStyles: ['Зимняя со льда'],
      boatType: 'Без техники',
      homeDistrict: 'Архангельск',
      createdAt: new Date().toISOString()
    };
    const newTrip = await sqliteStorage.createTrip(tripData, organizer);
    res.status(201).json(newTrip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/trips/:id', async (req: Request, res: Response) => {
  try {
    const updated = await sqliteStorage.updateTrip(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Trip not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/trips/:id', async (req: Request, res: Response) => {
  try {
    await sqliteStorage.deleteTrip(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/trips/:id/join', async (req: Request, res: Response) => {
  try {
    const { userId, userName, telegramUsername } = req.body;
    let user = userId ? await sqliteStorage.getUserById(userId) : undefined;
    if (!user) {
      user = {
        id: userId || `u-${Date.now()}`,
        name: userName || 'Рыбак',
        telegramUsername: telegramUsername || '',
        experienceLevel: 'Любитель',
        fishingStyles: ['Зимняя со льда'],
        boatType: 'Без техники',
        homeDistrict: 'Архангельск',
        createdAt: new Date().toISOString()
      };
      await sqliteStorage.updateProfile(user.id, user);
    }
    const result = await sqliteStorage.joinTrip(req.params.id, user);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/trips/:id/leave', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const result = await sqliteStorage.leaveTrip(req.params.id, userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fishing History & Catches
apiRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const history = await sqliteStorage.getHistory();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/history', async (req: Request, res: Response) => {
  try {
    const entry = req.body;
    if (!entry.location || !entry.catches) {
      return res.status(400).json({ error: 'Location and catches are required' });
    }
    const newEntry = await sqliteStorage.addHistory(entry);
    res.status(201).json(newEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/history/:id', async (req: Request, res: Response) => {
  try {
    const updated = await sqliteStorage.updateHistory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'History not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/history/:id', async (req: Request, res: Response) => {
  try {
    await sqliteStorage.deleteHistory(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fishing Spots
apiRouter.get('/spots', async (req: Request, res: Response) => {
  try {
    const spots = await sqliteStorage.getSpots();
    res.json(spots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/spots', async (req: Request, res: Response) => {
  try {
    const spot = req.body;
    if (spot.lat === undefined || spot.lon === undefined) {
      return res.status(400).json({ error: 'Coordinates are required' });
    }
    const newSpot = await sqliteStorage.addSpot(spot);
    res.status(201).json(newSpot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/spots/:id', async (req: Request, res: Response) => {
  try {
    const updated = await sqliteStorage.updateSpot(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Spot not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/spots/:id', async (req: Request, res: Response) => {
  try {
    await sqliteStorage.deleteSpot(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logs & Bot console
apiRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const logs = await sqliteStorage.getLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/logs', async (req: Request, res: Response) => {
  try {
    const { role, text, type } = req.body;
    const log = await sqliteStorage.addLog(role || 'Пользователь', text, type || 'text');
    res.status(201).json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/queue', (req: Request, res: Response) => {
  res.json([]);
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

// Auto-deployment Webhook (for GitHub / CI/CD / local deploy triggers)
apiRouter.post('/deploy/webhook', async (req: Request, res: Response) => {
  const { exec } = await import('child_process');
  console.log('[Deploy] Webhook triggered. Initiating auto-update & rebuild...');
  
  res.json({ 
    status: 'received', 
    message: 'Deploy task started. Running git pull, npm build and PM2 restart...' 
  });

  exec('./deploy.sh', (err, stdout, stderr) => {
    if (err) {
      console.error('[Deploy] Error during deployment script:', err, stderr);
    } else {
      console.log('[Deploy] Deployment successful:', stdout);
    }
  });
});
