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
from config import WEBAPP_URL, BOT_USERNAME

router = Router()

@router.inline_query()
async def inline_fishing_query(inline_query: InlineQuery):
    raw_query = inline_query.query.strip().lower()
    user_id = str(inline_query.from_user.id)
    username = inline_query.from_user.username or ""
    first_name = inline_query.from_user.first_name or "Рыбак"

    results = []

    # Get user car
    car = database.get_user_by_tg(user_id, username)
    t_name = car.get("transport_name", "Нива 4x4 / УАЗ")
    f_type = car.get("fuel_type", "АИ-92")
    f_cons = float(car.get("fuel_consumption", 10.5))
    f_price = float(car.get("fuel_price", 56.5))
    tot_seats = int(car.get("total_seats", 4))
    free_seats = int(car.get("available_seats", 3))
    cost_per_km = (f_cons / 100.0) * f_price

    # 0. Dynamic distance calculation if user typed a number (e.g. "@bot 120")
    if raw_query.replace("km", "").replace("км", "").strip().isdigit():
        km = float(raw_query.replace("km", "").replace("км", "").strip())
        total_fuel = km * cost_per_km
        per_person = total_fuel / max(1, tot_seats)
        per_2 = total_fuel / 2.0

        calc_text = (
            f"⛽️ <b>Расчёт поездки на {km:.0f} км ({t_name}):</b>\n\n"
            f"• Расстояние: <b>{km:.0f} км</b>\n"
            f"• Авто: <b>{t_name}</b> ({f_cons:.1f} л/100км, {f_type})\n"
            f"• Общая сумма на бензин: <b>{total_fuel:.0f} ₽</b>\n\n"
            f"<blockquote>👥 <b>Разбивка на экипаж:</b>\n"
            f"• Вдвоём: по <b>{per_2:.0f} ₽</b> с человека\n"
            f"• Вчетвером: по <b>{per_person:.0f} ₽</b> с человека</blockquote>\n\n"
            f"<i>Рассчитано через Поморский рыболовный бот:</i>"
        )
        results.append(
            InlineQueryResultArticle(
                id=f"calc_{km}",
                title=f"⛽️ Расчёт на {km:.0f} км: {total_fuel:.0f} ₽ (по {per_person:.0f} ₽/чел)",
                description=f"Авто: {t_name} • {cost_per_km:.2f} ₽/км • {f_cons:.1f} л/100км",
                input_message_content=InputTextMessageContent(
                    message_text=calc_text,
                    parse_mode="HTML"
                ),
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [
                            InlineKeyboardButton(
                                text="📱 Открыть калькулятор в WebApp",
                                web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                            )
                        ],
                        [
                            InlineKeyboardButton(
                                text="🚗 Карточка авто",
                                switch_inline_query="car"
                            )
                        ]
                    ]
                ),
                thumbnail_url="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&h=120&fit=crop"
            )
        )

    # 1. Car Card Result (Мой автомобиль и бензин)
    if not raw_query or "car" in raw_query or "авто" in raw_query or "машин" in raw_query or "бенз" in raw_query:
        car_share_text = (
            f"🚗 <b>Экипаж и транспорт: {first_name}</b>\n\n"
            f"• <b>Техника:</b> {t_name}\n"
            f"• <b>Топливо:</b> {f_type} (<code>{f_price:.1f} ₽/л</code>, расход <code>{f_cons:.1f} л/100км</code>)\n"
            f"• <b>Свободных мест:</b> <b>{free_seats}</b> из {tot_seats}\n"
            f"• <b>Себестоимость:</b> <code>{cost_per_km:.2f} ₽/км</code>\n\n"
            f"<blockquote>⛽️ <b>Примерные затраты на бензин:</b>\n"
            f"• 100 км = <b>{cost_per_km * 100:.0f} ₽</b> (~{(cost_per_km * 100) / max(1, tot_seats):.0f} ₽/чел)\n"
            f"• 150 км = <b>{cost_per_km * 150:.0f} ₽</b> (~{(cost_per_km * 150) / max(1, tot_seats):.0f} ₽/чел)</blockquote>\n\n"
            f"<i>Готов взять попутчиков на рыбалку! Нажмите кнопку ниже:</i>"
        )
        results.append(
            InlineQueryResultArticle(
                id=f"car_{user_id}",
                title=f"🚗 Мой автомобиль: {t_name} (свободно {free_seats} мест)",
                description=f"Расход: {f_cons:.1f} л/100км • {cost_per_km:.2f} ₽/км • {f_type}",
                input_message_content=InputTextMessageContent(
                    message_text=car_share_text,
                    parse_mode="HTML"
                ),
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [
                            InlineKeyboardButton(
                                text="📱 Открыть профиль водителя",
                                web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                            )
                        ],
                        [
                            InlineKeyboardButton(
                                text="⛽️ Рассчитать километраж",
                                switch_inline_query_current_chat="120"
                            ),
                            InlineKeyboardButton(
                                text="📅 Собрать выезд",
                                switch_inline_query="trips"
                            )
                        ]
                    ]
                ),
                thumbnail_url="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=120&h=120&fit=crop"
            )
        )

    # 2. Trips (Запланированные рыбалки)
    trips = database.get_trips()
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

        if raw_query and "trip" not in raw_query and "выезд" not in raw_query and raw_query not in title.lower() and raw_query not in dest.lower():
            continue

        crew_list_str = ""
        if parts:
            crew_list_str = "\n👥 <b>Текущий экипаж:</b>\n" + "\n".join([f"• {p.get('userName', 'Рыбак')} (@{p.get('telegramUsername', '')})" for p in parts])

        trip_text = (
            f"🎣 <b>Рыболовный выезд: {title}</b>\n\n"
            f"📍 <b>Место:</b> {dest}\n"
            f"📅 <b>Дата и время:</b> {date} в {time}\n"
            f"🚗 <b>Транспорт:</b> {trip.get('transport_type', 'Авто')} | Сбор: {trip.get('meet_place', 'По согласованию')}\n"
            f"⛵️ <b>Свободных мест:</b> <b>{free_slots} из {max_crew}</b>\n"
            f"👤 <b>Организатор:</b> {organizer}\n"
            f"{crew_list_str}\n\n"
            f"<i>Записывайтесь в экипаж кнопками ниже:</i>"
        )

        results.append(
            InlineQueryResultArticle(
                id=f"trip_{trip_id}",
                title=f"📅 {title} ({dest})",
                description=f"Свободно мест: {free_slots}/{max_crew} • {date} в {time}",
                input_message_content=InputTextMessageContent(
                    message_text=trip_text,
                    parse_mode="HTML"
                ),
                reply_markup=InlineKeyboardMarkup(
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
                                text="📱 Открыть карточку в WebApp",
                                web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                            )
                        ]
                    ]
                ),
                thumbnail_url="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=120&h=120&fit=crop"
            )
        )

    # 3. Spots (Точки лова на Яндекс.Картах)
    spots = database.get_spots()
    for spot in spots[:6]:
        name = spot.get("name", "Точка")
        area = spot.get("area", "Белое море")
        lat = spot.get("lat", 0.0)
        lon = spot.get("lon", 0.0)
        desc = spot.get("description", "")
        spot_id = spot.get("id", "")

        if raw_query and "spot" not in raw_query and "точк" not in raw_query and raw_query not in name.lower() and raw_query not in area.lower():
            continue

        spot_text = (
            f"📍 <b>Рыболовная точка: {name}</b>\n"
            f"🌊 <b>Акватория:</b> {area}\n"
            f"🧭 <b>GPS-координаты:</b> <code>{lat:.5f}, {lon:.5f}</code>\n"
            f"📝 <b>Описание:</b> {desc}\n\n"
            f"🗺 <a href=\"https://yandex.ru/maps/?rtext=~{lat}%2C{lon}&rtt=auto\">Проложить маршрут в Яндекс.Картах</a>\n\n"
            f"<i>Точка доступна на интерактивной спутниковой карте в Mini App:</i>"
        )

        results.append(
            InlineQueryResultArticle(
                id=f"spot_{spot_id}",
                title=f"📍 {name} ({area})",
                description=f"Координаты: {lat:.4f}, {lon:.4f} • Яндекс.Карты",
                input_message_content=InputTextMessageContent(
                    message_text=spot_text,
                    parse_mode="HTML"
                ),
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [
                            InlineKeyboardButton(
                                text="🗺 Открыть точку на карте",
                                web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=spots")
                            )
                        ]
                    ]
                ),
                thumbnail_url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&h=120&fit=crop"
            )
        )

    # 4. Quick Mini App launcher
    results.append(
        InlineQueryResultArticle(
            id="app_quick_share",
            title="🌊 Запустить Поморский Mini App во весь экран",
            description="Личный кабинет, снасти, авто, карта Яндекс, выезды",
            input_message_content=InputTextMessageContent(
                message_text=(
                    "🎣 <b>Поморское Приложение Рыбака (Архангельск & Северодвинск)</b>\n\n"
                    "• 🚗 Настройки авто и расчёт топлива на экипаж\n"
                    "• 📅 Запланированные рыбалки и сбор экипажей\n"
                    "• 🗺 Интерактивная карта Яндекс с проверенными точками лова\n"
                    "• 🐟 Журнал уловов и трофеев\n\n"
                    "<i>Откройте приложение нажатием кнопки ниже:</i>"
                ),
                parse_mode="HTML"
            ),
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="🌊 Открыть Веб-приложение",
                            web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                        )
                    ],
                    [
                        InlineKeyboardButton(
                            text="➕ Добавить в группу / канал",
                            url=f"https://t.me/{BOT_USERNAME}?startgroup=true"
                        )
                    ]
                ]
            ),
            thumbnail_url="https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=120&h=120&fit=crop"
        )
    )

    await inline_query.answer(results=results, cache_time=3, is_personal=True)
