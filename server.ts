import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config.ts';
import { apiRouter } from './server/routes/api.ts';
import { telegramBot } from './server/telegramBot.ts';

async function startServer() {
  const app = express();
  const PORT = config.port;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'arkhangelsk-fishing-bot',
      botUsername: config.botUsername,
      timestamp: new Date().toISOString()
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

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

  app.listen(PORT, config.host, () => {
    console.log(`=======================================================`);
    console.log(`⚓ Arkhangelsk Fishing Bot Server started`);
    console.log(`🌐 Local & WebApp URL: http://${config.host}:${PORT}`);
    console.log(`🤖 Telegram Bot Polling: ${telegramBot.getStatus().isPolling ? 'Active' : 'Standby'}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
