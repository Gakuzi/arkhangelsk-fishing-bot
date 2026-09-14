import asyncio
import logging
from aiogram import Bot, Dispatcher
from config import TELEGRAM_BOT_TOKEN
import handlers_group
import handlers_private
import database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    database.init_db()

    if not TELEGRAM_BOT_TOKEN:
        logger.warning(
            "TELEGRAM_BOT_TOKEN не задан в .env! "
            "Укажите TELEGRAM_BOT_TOKEN для запуска Telegram бота."
        )
        return

    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    dp = Dispatcher()

    # Регистрируем роутеры
    dp.include_router(handlers_private.router)
    dp.include_router(handlers_group.router)

    logger.info("Запуск Telegram-бота Arkhangelsk Fishing Bot (Long-polling)...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Бот остановлен пользователем.")
