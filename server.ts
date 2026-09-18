import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config.ts';
import { apiRouter } from './server/routes/api.ts';
import { telegramBot } from './server/telegramBot.ts';

async function startServer() {
  const app = express();
  const PORT = process.env.DISABLE_HMR === 'true' ? 3000 : config.port;
  const HOST = '0.0.0.0';

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

  // Vite middleware for development (only when running dev server directly, never for compiled bundle)
  const isProd = process.env.NODE_ENV === 'production' || (process.argv[1] && process.argv[1].includes('dist'));
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`⚓ Arkhangelsk Fishing Bot Server started`);
    console.log(`🌐 Local & WebApp URL: http://${HOST}:${PORT}`);
    console.log(`🤖 Telegram Bot Polling: ${telegramBot.getStatus().isPolling ? 'Active' : 'Standby'}`);
    console.log(`=======================================================`);
  });

  // If in production on VPS, also listen on alternate port (3005 or 3000) so Nginx works with either configuration
  const alternatePort = PORT === 3000 ? 3005 : 3000;
  try {
    const secondaryServer = app.listen(alternatePort, HOST, () => {
      console.log(`🌐 Secondary port ${alternatePort} active (Nginx reverse-proxy redundancy)`);
    });
    secondaryServer.on('error', () => {
      // Gracefully ignore if alternate port is unavailable or not allowed
    });
  } catch {}
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
