import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
WEBAPP_URL = os.getenv("WEBAPP_URL") or os.getenv("APP_URL") or "https://fishing-bot.e-klimov.ru"
BOT_USERNAME = os.getenv("BOT_USERNAME", "ArkhangelskFishingBot")
LOG_DOC_ID = os.getenv("LOG_DOC_ID", "")
QUEUE_DOC_ID = os.getenv("QUEUE_DOC_ID", "")

