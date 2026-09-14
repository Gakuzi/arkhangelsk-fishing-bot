import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.types import MenuButtonWebApp, WebAppInfo, BotCommand
from config import TELEGRAM_BOT_TOKEN, WEBAPP_URL
import handlers_group
import handlers_private
import handlers_inline
import database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def setup_bot_ui(bot: Bot):
    """Настройка кнопки главного меню Mini App и списка команд бота"""
    try:
        # 1. Установка кнопки запуска Главного Mini App (Menu Button)
        if WEBAPP_URL:
            await bot.set_chat_menu_button(
                menu_button=MenuButtonWebApp(
                    text="🎣 Меню Рыбака",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            )
            logger.info(f"Кнопка Menu Button WebApp успешно установлена: {WEBAPP_URL}")

        # 2. Установка списка быстрых команд
        commands = [
            BotCommand(command="start", description="Запустить бота и открыть приложение"),
            BotCommand(command="app", description="🌊 Открыть Mini App во весь экран"),
            BotCommand(command="trips", description="📅 Запланированные рыбалки и экипаж"),
            BotCommand(command="spots", description="🗺 Карта и координаты точек лова"),
            BotCommand(command="profile", description="👤 Личный кабинет рыбака")
        ]
        await bot.set_my_commands(commands)
        logger.info("Команды бота успешно зарегистрированы.")
    except Exception as e:
        logger.warning(f"Ошибка при настройке меню/команд: {e}")

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

    # Регистрируем роутеры: приватный, групповой и инлайн
    dp.include_router(handlers_inline.router)
    dp.include_router(handlers_private.router)
    dp.include_router(handlers_group.router)

    # Настраиваем визуальный интерфейс (Menu Button WebApp)
    await setup_bot_ui(bot)

    logger.info("Запуск Telegram-бота Arkhangelsk Fishing Bot (Long-polling + Inline Mode)...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Бот остановлен пользователем.")
