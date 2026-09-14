from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message
import keyboards
import database

router = Router()

@router.message(F.chat.type == "private", CommandStart())
async def handle_start(message: Message):
    user = message.from_user.first_name if message.from_user else "Рыбак"

    welcome_text = (
        f"👋 Здорово, <b>{user}</b>!\n\n"
        f"Добро пожаловать в <b>Поморский Рыболовный Бот</b> (Архангельск, Северная Двина, Белое Море).\n\n"
        f"📱 <b>Веб-приложение доступно на смартфонах и ПК!</b>\n"
        f"Нажмите кнопку ниже, чтобы открыть:\n"
        f"• 👤 <b>Личный кабинет</b> и настройку профиля\n"
        f"• 📅 <b>Запланированные рыбалки</b> и запись в экипажи\n"
        f"• 🐟 <b>Историю рыбалок</b> с отзывами, отметками об уловах и снастях\n"
        f"• 🗺 <b>Карту точек</b> и GPS-координаты лова"
    )

    await message.answer(
        welcome_text,
        parse_mode="HTML",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

@router.message(F.chat.type == "private", Command("webapp"))
async def handle_webapp_command(message: Message):
    await message.answer(
        "🌊 Нажмите кнопку для запуска Веб-приложения Рыбака:",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

@router.message(F.chat.type == "private", Command("spots"))
async def handle_spots_command(message: Message):
    spots = database.get_spots()
    text = "📍 <b>Популярные рыбные точки Поморья:</b>\n\n"
    for s in spots[:4]:
        text += f"• <b>{s['name']}</b> ({s['area']})\n  Координаты: <code>{s['lat']}, {s['lon']}</code>\n"

    await message.answer(
        text,
        parse_mode="HTML",
        reply_markup=keyboards.get_spots_keyboard()
    )

@router.message(F.chat.type == "private", Command("trips"))
async def handle_trips_command(message: Message):
    await message.answer(
        "📅 Посмотреть запланированные выезды и записаться в экипаж:",
        reply_markup=keyboards.get_trips_keyboard()
    )

@router.message(F.chat.type == "private", F.location)
async def handle_private_location(message: Message):
    user = message.from_user.first_name if message.from_user else "Рыбак"
    username = message.from_user.username or ""
    lat = message.location.latitude
    lon = message.location.longitude

    spot_id = database.add_spot(
        name=f"Точка от {user}",
        lat=lat,
        lon=lon,
        area="Дельта Северной Двины / Поморье",
        added_by=f"@{username}" if username else user,
        description="Отправлено напрямую через Telegram бот"
    )

    await message.answer(
        f"📍 Точка сохранена!\n"
        f"Широта: <code>{lat:.5f}</code>\n"
        f"Долгота: <code>{lon:.5f}</code>\n\n"
        f"Точка доступна на интерактивной карте в Веб-приложении:",
        parse_mode="HTML",
        reply_markup=keyboards.get_spots_keyboard()
    )
