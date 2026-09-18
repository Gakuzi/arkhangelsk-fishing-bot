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

  const primaryPort = process.env.DISABLE_HMR === 'true' ? 3000 : (Number(process.env.PORT) || 3005);
  const secondaryPort = primaryPort === 3005 ? 3000 : 3005;

  const server = app.listen(primaryPort, HOST, () => {
    console.log(`=======================================================`);
    console.log(`⚓ Arkhangelsk Fishing Bot Server started on port ${primaryPort}`);
    console.log(`🌐 Local & WebApp URL: http://${HOST}:${primaryPort}`);
    console.log(`🤖 Telegram Bot Polling: ${telegramBot.getStatus().isPolling ? 'Active' : 'Standby'}`);
    console.log(`=======================================================`);
  });

  server.on('error', (err: any) => {
    console.warn(`Warning on primary port ${primaryPort}: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${primaryPort} occupied, starting on secondary port ${secondaryPort}...`);
      const backupServer = app.listen(secondaryPort, HOST, () => {
        console.log(`⚓ Arkhangelsk Fishing Bot Server active on fallback port ${secondaryPort}`);
      });
      backupServer.on('error', (bErr: any) => {
        console.error(`Fatal: secondary port ${secondaryPort} also failed:`, bErr.message);
      });
    }
  });

  // If primary port succeeded, also attempt listening on secondary port for Nginx proxy redundancy
  try {
    const secondServer = app.listen(secondaryPort, HOST);
    secondServer.on('error', () => {
      // Ignored: secondary port occupied by another service on host
    });
    secondServer.on('listening', () => {
      console.log(`🌐 Redundancy port ${secondaryPort} active for Nginx`);
    });
  } catch {}
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
