import path from 'path';

export const config = {
  port: Number(process.env.PORT) || 3005,
  host: process.env.HOST || '0.0.0.0',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '8666462902:AAFhIMmwQtk0KmN_iM60PAEfsWBCvS0OYhw',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '-1004386693265',
  logDocId: process.env.LOG_DOC_ID || '1hs2ZbXq-6Ijc4z4g0KyilkMnwZ63b6l0e3D6tobACFU',
  queueDocId: process.env.QUEUE_DOC_ID || '1j_2ta_pQPH2kuETaRPBJkU6QCRkVzQNgxV7Ql6PBUdA',
  appUrl: process.env.APP_URL || 'https://fishing-bot.e-klimov.ru',
  botUsername: process.env.BOT_USERNAME || 'ArkhangelskFishingBot',
  enablePolling: process.env.ENABLE_NODE_BOT_POLLING !== 'false'
};
