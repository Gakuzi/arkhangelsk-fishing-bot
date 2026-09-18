import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  if (typeof (process as any).loadEnvFile === 'function') {
    try {
      (process as any).loadEnvFile();
      return;
    } catch {}
  }

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
          const key = line.slice(0, eqIdx).trim();
          let val = line.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {}
}

loadEnvFile();

export const config = {
  port: Number(process.env.PORT) || 3005,
  host: process.env.HOST || '0.0.0.0',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  logDocId: process.env.LOG_DOC_ID || '',
  queueDocId: process.env.QUEUE_DOC_ID || '',
  appUrl: process.env.APP_URL || 'https://fishing-bot.e-klimov.ru',
  botUsername: process.env.BOT_USERNAME || 'ArkhangelskFishingBot',
  enablePolling: process.env.ENABLE_NODE_BOT_POLLING !== 'false'
};
