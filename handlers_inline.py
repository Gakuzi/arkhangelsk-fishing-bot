import json
from aiogram import Router
from aiogram.types import (
    InlineQuery,
    InlineQueryResultArticle,
    InputTextMessageContent,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo
)
import database
from config import WEBAPP_URL

router = Router()

@router.inline_query()
async def inline_fishing_query(inline_query: InlineQuery):
    query = inline_query.query.strip().lower()
    trips = database.get_trips()
    spots = database.get_spots()
    results = []

    # 1. Запланированные рыбалки (trips)
    for trip in trips:
        title = trip.get("title", "Рыбалка")
        dest = trip.get("destination", "Архангельская обл.")
        date = trip.get("date", "")
        time = trip.get("meet_time", "")
        max_crew = trip.get("max_crew", 4)
        parts = trip.get("participants", [])
        free_slots = max(0, max_crew - len(parts))
        organizer = trip.get("organizer_name", "Капитан")
        trip_id = trip.get("id", "")

        # Фильтрация по запросу, если ввели текст
        if query and query not in title.lower() and query not in dest.lower():
            continue

        crew_list_str = ""
        if parts:
            crew_list_str = "\n👥 <b>Экипаж:</b>\n" + "\n".join([f"• {p.get('userName', 'Рыбак')} (@{p.get('telegramUsername', '')})" for p in parts])

        trip_text = (
            f"🎣 <b>Рыболовная экспедиция: {title}</b>\n\n"
            f"📍 <b>Место:</b> {dest}\n"
            f"📅 <b>Дата:</b> {date} в {time}\n"
            f"🚗 <b>Техника/сбор:</b> {trip.get('transport_type', 'Без техники')} | {trip.get('meet_place', 'По согласованию')}\n"
            f"⛵️ <b>Свободных мест:</b> {free_slots} из {max_crew}\n"
            f"👤 <b>Организатор:</b> {organizer}\n"
            f"{crew_list_str}\n\n"
            f"<i>Нажмите кнопку ниже, чтобы записаться в экипаж:</i>"
        )

        reply_markup = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="🔥 Записаться в экипаж",
                        callback_data=f"trip_join:{trip_id}"
                    ),
                    InlineKeyboardButton(
                        text="🫡 Не смогу",
                        callback_data=f"trip_decline:{trip_id}"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="📱 Открыть в приложении",
                        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                    )
                ]
            ]
        )

        results.append(
            InlineQueryResultArticle(
                id=f"trip_{trip_id}",
                title=f"📅 {title}",
                description=f"📍 {dest} | {date} {time} | Свободно мест: {free_slots}",
                input_message_content=InputTextMessageContent(
                    message_text=trip_text,
                    parse_mode="HTML"
                ),
                reply_markup=reply_markup,
                thumbnail_url="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=120&h=120&fit=crop"
            )
        )

    # 2. Рыболовные точки (spots)
    for spot in spots[:5]:
        name = spot.get("name", "Точка")
        area = spot.get("area", "Белое море")
        lat = spot.get("lat", 0.0)
        lon = spot.get("lon", 0.0)
        desc = spot.get("description", "")
        spot_id = spot.get("id", "")

        if query and query not in name.lower() and query not in area.lower():
            continue

        spot_text = (
            f"📍 <b>Рыболовная точка: {name}</b>\n"
            f"🌊 <b>Район:</b> {area}\n"
            f"🧭 <b>Координаты:</b> <code>{lat:.5f}, {lon:.5f}</code>\n"
            f"📝 <b>Описание:</b> {desc}\n\n"
            f"<i>Точка доступна на интерактивной карте в Mini App:</i>"
        )

        reply_markup = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="🗺 Посмотреть на карте",
                        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=spots")
                    )
                ]
            ]
        )

        results.append(
            InlineQueryResultArticle(
                id=f"spot_{spot_id}",
                title=f"📍 {name}",
                description=f"{area} ({lat:.4f}, {lon:.4f})",
                input_message_content=InputTextMessageContent(
                    message_text=spot_text,
                    parse_mode="HTML"
                ),
                reply_markup=reply_markup,
                thumbnail_url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&h=120&fit=crop"
            )
        )

    # 3. Быстрая кнопка запуска Mini App в inline
    results.append(
        InlineQueryResultArticle(
            id="app_quick_share",
            title="🌊 Открыть Поморское Приложение Рыбака",
            description="Карта глубин, календарь приливов, запланированные рыбалки",
            input_message_content=InputTextMessageContent(
                message_text=(
                    "🎣 <b>Поморское Приложение Рыбака Архангельской области</b>\n\n"
                    "• 📅 Запланированные рыбалки и сбор экипажей\n"
                    "• 📍 GPS-точки и карта глубин Белого моря и Двины\n"
                    "• 🐟 Отчеты об уловах и личный кабинет\n\n"
                    "<i>Откройте приложение нажатием кнопки ниже:</i>"
                ),
                parse_mode="HTML"
            ),
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="🎣 Запустить Mini App",
                            web_app=WebAppInfo(url=WEBAPP_URL)
                        )
                    ]
                ]
            ),
            thumbnail_url="https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=120&h=120&fit=crop"
        )
    )

    await inline_query.answer(results=results, cache_time=5, is_personal=True)
