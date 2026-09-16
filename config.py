import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8666462902:AAFhIMmwQtk0KmN_iM60PAEfsWBCvS0OYhw")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "-1004386693265")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://fishing-bot.e-klimov.ru")
BOT_USERNAME = os.getenv("BOT_USERNAME", "ArkhangelskFishingBot")
LOG_DOC_ID = os.getenv("LOG_DOC_ID", "1hs2ZbXq-6Ijc4z4g0KyilkMnwZ63b6l0e3D6tobACFU")
QUEUE_DOC_ID = os.getenv("QUEUE_DOC_ID", "1j_2ta_pQPH2kuETaRPBJkU6QCRkVzQNgxV7Ql6PBUdA")

