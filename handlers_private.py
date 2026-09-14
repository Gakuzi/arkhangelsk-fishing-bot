import json
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
        f"📱 <b>Telegram Mini App доступно на смартфонах и ПК!</b>\n"
        f"Нажмите кнопку <b>«🎣 Меню Рыбака»</b> рядом со строкой ввода или кнопки ниже:\n"
        f"• 👤 <b>Личный кабинет</b> и профиль рыбака\n"
        f"• 📅 <b>Запланированные рыбалки</b> и запись в экипажи\n"
        f"• 🐟 <b>История рыбалок</b> с отзывами и отметками об уловах\n"
        f"• 🗺 <b>Карта точек</b> и GPS-координаты лова"
    )

    await message.answer(
        welcome_text,
        parse_mode="HTML",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

@router.message(F.chat.type == "private", Command(commands=["app", "webapp"]))
async def handle_webapp_command(message: Message):
    await message.answer(
        "🌊 Нажмите кнопку для запуска Поморского Mini App во весь экран:",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

@router.message(F.chat.type == "private", Command("profile"))
async def handle_profile_command(message: Message):
    await message.answer(
        "👤 <b>Личный кабинет рыбака:</b>\nНастройте вашу технику, снасти, стаж и район лова:",
        parse_mode="HTML",
        reply_markup=keyboards.get_profile_keyboard()
    )

@router.message(F.chat.type == "private", Command("history"))
async def handle_history_command(message: Message):
    await message.answer(
        "🐟 <b>Журнал рыбалок:</b>\nОтчеты об уловах, фото трофеев и снасти:",
        parse_mode="HTML",
        reply_markup=keyboards.get_history_keyboard()
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

@router.message(F.chat.type == "private", F.web_app_data)
async def handle_web_app_data(message: Message):
    """Обработка данных, переданных из Telegram Mini App (sendData)"""
    user = message.from_user.first_name if message.from_user else "Рыбак"
    raw_data = message.web_app_data.data

    try:
        payload = json.loads(raw_data)
        action = payload.get("action", "unknown")

        if action == "join_crew":
            trip_title = payload.get("tripTitle", "Рыбалка")
            database.add_log(user, f"Записался в экипаж: {trip_title}", log_type="vote")
            await message.reply(
                f"🎉 <b>{user}</b>, вы успешно записались в экипаж!\n"
                f"Экспедиция: <b>{trip_title}</b>\n"
                f"Капитан и участники уведомлены.",
                parse_mode="HTML"
            )

        elif action == "add_catch":
            fish = payload.get("fish", "Рыба")
            weight = payload.get("weight", 0)
            spot = payload.get("spot", "Белое море")
            database.add_log(user, f"Улов: {fish} ({weight} кг) на {spot}", log_type="text")
            await message.reply(
                f"🎣 <b>Отчет принят!</b>\n"
                f"Вид: <b>{fish}</b> ({weight} кг)\n"
                f"Место: <b>{spot}</b>\n"
                f"Запись внесена в ваш личный дневник и общую статистику Поморья!",
                parse_mode="HTML"
            )

        elif action == "add_spot":
            name = payload.get("name", "Новая точка")
            lat = payload.get("lat")
            lon = payload.get("lon")
            if lat and lon:
                database.add_spot(name, float(lat), float(lon), "Архангельская обл.", user)
                await message.reply(
                    f"📍 Точка <b>{name}</b> (<code>{lat}, {lon}</code>) добавлена на карту!",
                    parse_mode="HTML"
                )

        else:
            database.add_log(user, f"Данные из WebApp: {raw_data}", log_type="system")
            await message.reply(
                f"✅ Данные из Mini App успешно сохранены!",
                parse_mode="HTML"
            )

    except Exception as e:
        database.add_log(user, f"Ошибка парсинга WebApp данных: {e}", log_type="system")
        await message.reply("✅ Действие в приложении зафиксировано!")

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
