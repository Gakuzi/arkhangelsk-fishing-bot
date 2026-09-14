import path from 'path';

export const config = {
  port: 3000,
  host: '0.0.0.0',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '8666462902:AAFhIMmwQtk0KmN_iM60PAEfsWBCvS0OYhw',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '-1004386693265',
  logDocId: process.env.LOG_DOC_ID || '1hs2ZbXq-6Ijc4z4g0KyilkMnwZ63b6l0e3D6tobACFU',
  queueDocId: process.env.QUEUE_DOC_ID || '1j_2ta_pQPH2kuETaRPBJkU6QCRkVzQNgxV7Ql6PBUdA',
  appUrl: process.env.APP_URL || 'https://ais-dev-5zeorngmdx7pxrecq7zklu-559158702581.europe-west1.run.app',
  botUsername: 'ArkhangelskFishingBot'
};
