import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "-1002381273912")
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:3000")
LOG_DOC_ID = os.getenv("LOG_DOC_ID", "")
QUEUE_DOC_ID = os.getenv("QUEUE_DOC_ID", "")
