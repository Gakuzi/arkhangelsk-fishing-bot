import json
import logging
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

logger = logging.getLogger(__name__)
router = Router()

@router.inline_query()
async def inline_fishing_query(inline_query: InlineQuery):
    results = []
    try:
        raw_query = inline_query.query.strip().lower()
        user_id = str(inline_query.from_user.id)
        username = inline_query.from_user.username or ""
        first_name = inline_query.from_user.first_name or "Рыбак"

        # Get user car & transport profile safely
        car = database.get_user_by_tg(user_id, username)
        t_name = car.get("transport_name") or "УАЗ Патриот / Нива 4x4"
        f_type = car.get("fuel_type") or "АИ-92"
        try:
            f_cons = float(car.get("fuel_consumption") or 11.0)
        except (ValueError, TypeError):
            f_cons = 11.0
        try:
            f_price = float(car.get("fuel_price") or 56.5)
        except (ValueError, TypeError):
            f_price = 56.5
        try:
            tot_seats = int(car.get("total_seats") or 4)
        except (ValueError, TypeError):
            tot_seats = 4
        try:
            free_seats = int(car.get("available_seats") if car.get("available_seats") is not None else 3)
        except (ValueError, TypeError):
            free_seats = 3

        cost_per_km = (f_cons / 100.0) * f_price
        has_car = bool(t_name and "без техники" not in t_name.lower())

        # 0. Quick Distance calculation if user types a number (e.g. "@bot 120" or "@bot 120км")
        clean_num = raw_query.replace("km", "").replace("км", "").strip()
        if clean_num.isdigit():
            km = float(clean_num)
            total_fuel = km * cost_per_km
            per_person = total_fuel / max(1, tot_seats)
            per_2 = total_fuel / 2.0
            per_3 = total_fuel / 3.0

            calc_text = (
                f"⛽️ <b>Расчёт поездки на {km:.0f} км ({t_name}):</b>\n\n"
                f"• Дистанция: <b>{km:.0f} км</b> туда-обратно\n"
                f"• Топливо: <b>{f_type}</b> ({f_cons:.1f} л/100км по {f_price:.1f} ₽/л)\n"
                f"• Итоговая стоимость бензина: <b>{total_fuel:.0f} ₽</b>\n\n"
                f"<blockquote expandable>👥 <b>Распределение расходов на экипаж:</b>\n"
                f"• Вдвоём: по <b>{per_2:.0f} ₽</b> с каждого\n"
                f"• Втроём: по <b>{per_3:.0f} ₽</b> с каждого\n"
                f"• Вчетвером: по <b>{per_person:.0f} ₽</b> с каждого</blockquote>\n\n"
                f"<i>Рассчитано через Поморский рыболовный бот Архангельска</i>"
            )
            results.append(
                InlineQueryResultArticle(
                    id=f"calc_{km}",
                    title=f"⛽️ {km:.0f} км = {total_fuel:.0f} ₽ (по {per_person:.0f} ₽ вчетвером)",
                    description=f"Авто: {t_name} • {cost_per_km:.2f} ₽/км • {f_cons:.1f} л/100км",
                    input_message_content=InputTextMessageContent(
                        message_text=calc_text,
                        parse_mode="HTML"
                    ),
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[
                            [
                                InlineKeyboardButton(
                                    text="📱 Открыть калькулятор в Mini App",
                                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                                )
                            ],
                            [
                                InlineKeyboardButton(
                                    text="🚗 Карточка авто",
                                    switch_inline_query_current_chat="car"
                                )
                            ]
                        ]
                    )
                )
            )

        # 1. Car / Crew Card (или "Ищу авто" если без машины)
        if not raw_query or any(k in raw_query for k in ["car", "авто", "машин", "бенз", "экипаж", "водитель"]):
            if has_car:
                car_share_text = (
                    f"🚗 <b>Экипаж и авто: {first_name}</b>\n\n"
                    f"• <b>Транспорт:</b> {t_name}\n"
                    f"• <b>Топливо:</b> {f_type} (<code>{f_price:.1f} ₽/л</code>, расход <code>{f_cons:.1f} л/100км</code>)\n"
                    f"• <b>Свободных мест:</b> <b>{free_seats} из {tot_seats}</b>\n"
                    f"• <b>Себестоимость хода:</b> <code>{cost_per_km:.2f} ₽/км</code>\n\n"
                    f"<blockquote expandable>⛽️ <b>Ориентир затрат на экипаж:</b>\n"
                    f"• 100 км = <b>{cost_per_km * 100:.0f} ₽</b> (по ~{(cost_per_km * 100) / max(1, tot_seats):.0f} ₽/чел)\n"
                    f"• 150 км = <b>{cost_per_km * 150:.0f} ₽</b> (по ~{(cost_per_km * 150) / max(1, tot_seats):.0f} ₽/чел)</blockquote>\n\n"
                    f"<i>Готов взять попутчиков на рыбалку! Нажмите кнопку ниже:</i>"
                )
                results.append(
                    InlineQueryResultArticle(
                        id=f"car_{user_id}",
                        title=f"🚗 {t_name} — Свободно {free_seats} мест",
                        description=f"Расход: {f_cons:.1f} л/100км • {cost_per_km:.2f} ₽/км • {f_type}",
                        input_message_content=InputTextMessageContent(
                            message_text=car_share_text,
                            parse_mode="HTML"
                        ),
                        reply_markup=InlineKeyboardMarkup(
                            inline_keyboard=[
                                [
                                    InlineKeyboardButton(
                                        text="📱 Профиль водителя в Mini App",
                                        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                                    )
                                ],
                                [
                                    InlineKeyboardButton(
                                        text="⛽️ Рассчитать километраж",
                                        switch_inline_query_current_chat="120"
                                    ),
                                    InlineKeyboardButton(
                                        text="📅 Все выезды",
                                        switch_inline_query_current_chat="trips"
                                    )
                                ]
                            ]
                        )
                    )
                )
            else:
                passenger_share_text = (
                    f"🚶‍♂️ <b>Ищу экипаж / водителя с машиной: {first_name}</b>\n\n"
                    f"• <b>Статус:</b> Без личного авто, ищу попутку на рыбалку\n"
                    f"• <b>Условия:</b> Готов на 100% разделить расходы на бензин\n"
                    f"• <b>Снаряжение:</b> Свой рыболовный ящик, ледобур и снасти с собой\n\n"
                    f"<i>Если у вас есть свободное место в машине или на снегоходе — напишите мне или откройте приложение:</i>"
                )
                results.append(
                    InlineQueryResultArticle(
                        id=f"passenger_{user_id}",
                        title="🚶‍♂️ Ищу экипаж / Водителя с машиной",
                        description="Без авто • Готов скинуться на бензин • Снасти готовы",
                        input_message_content=InputTextMessageContent(
                            message_text=passenger_share_text,
                            parse_mode="HTML"
                        ),
                        reply_markup=InlineKeyboardMarkup(
                            inline_keyboard=[
                                [
                                    InlineKeyboardButton(
                                        text="🚗 Взять в экипаж (Mini App)",
                                        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                                    )
                                ]
                            ]
                        )
                    )
                )

        # 2. Planned Trips (Запланированные выезды)
        try:
            trips = database.get_trips()
        except Exception:
            trips = []

        for trip in trips[:6]:
            title = trip.get("title") or "Рыбалка"
            dest = trip.get("destination") or "Архангельская обл."
            date = trip.get("date") or ""
            time = trip.get("meet_time") or ""
            max_crew = int(trip.get("max_crew") or 4)
            parts = trip.get("participants") or []
            free_slots = max(0, max_crew - len(parts))
            organizer = trip.get("organizer_name") or "Капитан"
            trip_id = str(trip.get("id") or "")
            transport = trip.get("transport_type") or "Авто / Снегоход"

            if raw_query and not any(k in raw_query for k in ["trip", "выезд", "рыбалк"]) and raw_query not in title.lower() and raw_query not in dest.lower():
                continue

            crew_list_str = ""
            if parts:
                crew_list_str = "\n👥 <b>Текущий экипаж:</b>\n" + "\n".join(
                    [f"• {p.get('userName', 'Рыбак')} (@{p.get('telegramUsername', '')})" for p in parts]
                )

            # Check if passenger trip or driver trip
            is_passenger_trip = (trip.get("trip_type") == "passenger") or (trip.get("has_car") == 0) or ("без машин" in transport.lower())
            
            # Generate Google Calendar link
            cal_title = f"Рыбалка: {title}"
            cal_link = f"https://calendar.google.com/calendar/render?action=TEMPLATE&text={cal_title.replace(' ', '+')}&details={dest.replace(' ', '+')}&location={dest.replace(' ', '+')}"

            if is_passenger_trip:
                trip_text = (
                    f"🚶‍♂️ <b>Поиск машины / экипажа: {title}</b>\n\n"
                    f"📍 <b>Куда:</b> {dest}\n"
                    f"📅 <b>Дата:</b> {date} в {time}\n"
                    f"👤 <b>Рыбак:</b> {organizer}\n"
                    f"🚗 <b>Статус:</b> Без авто, ищет экипаж / водителя\n"
                    f"⛽️ <b>Условия:</b> 100% готов разделить расходы на бензин\n"
                    f"📍 <b>Удобно подсесть:</b> {trip.get('meet_place', 'По договоренности')}\n"
                    f"{crew_list_str}\n\n"
                    f"<blockquote expandable>📅 <a href=\"{cal_link}\">Добавить этот выезд в свой календарь</a>\n"
                    f"Водители со свободными местами в авто — откликнитесь!</blockquote>\n\n"
                    f"<i>Нажмите кнопку ниже, чтобы взять рыбака в свой экипаж:</i>"
                )
                action_button_text = "🚗 Взять в свой экипаж"
            else:
                trip_text = (
                    f"🎣 <b>Рыболовный выезд: {title}</b>\n\n"
                    f"📍 <b>Место:</b> {dest}\n"
                    f"📅 <b>Дата и время:</b> {date} в {time}\n"
                    f"🚗 <b>Транспорт:</b> {transport} | <b>Сбор:</b> {trip.get('meet_place', 'По договоренности')}\n"
                    f"⛵️ <b>Свободных мест:</b> <b>{free_slots} из {max_crew}</b>\n"
                    f"👤 <b>Организатор:</b> {organizer}\n"
                    f"{crew_list_str}\n\n"
                    f"<blockquote expandable>📅 <a href=\"{cal_link}\">Добавить этот выезд в свой календарь</a>\n"
                    f"Сбор строго вовремя, связь в чате.</blockquote>\n\n"
                    f"<i>Записывайтесь в экипаж кнопкой ниже:</i>"
                )
                action_button_text = "🔥 Записаться в экипаж"

            results.append(
                InlineQueryResultArticle(
                    id=f"trip_{trip_id}",
                    title=f"{'🚶‍♂️ Ищет авто:' if is_passenger_trip else '🚗 Экипаж:'} {title}",
                    description=f"{'Ищет водителя' if is_passenger_trip else f'Свободно мест: {free_slots}/{max_crew}'} • {date} в {time}",
                    input_message_content=InputTextMessageContent(
                        message_text=trip_text,
                        parse_mode="HTML",
                        disable_web_page_preview=True
                    ),
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[
                            [
                                InlineKeyboardButton(
                                    text=action_button_text,
                                    callback_data=f"trip_join:{trip_id}"
                                ),
                                InlineKeyboardButton(
                                    text="🫡 Не смогу",
                                    callback_data=f"trip_decline:{trip_id}"
                                )
                            ],
                            [
                                InlineKeyboardButton(
                                    text="📱 Открыть в Mini App",
                                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                                ),
                                InlineKeyboardButton(
                                    text="📅 В календарь",
                                    url=cal_link
                                )
                            ]
                        ]
                    )
                )
            )

        # 3. Spots (Точки лова на Яндекс.Картах)
        try:
            spots = database.get_spots()
        except Exception:
            spots = []

        for spot in spots[:6]:
            name = spot.get("name") or "Точка"
            area = spot.get("area") or "Белое море"
            lat = float(spot.get("lat") or 64.8820)
            lon = float(spot.get("lon") or 40.2910)
            desc = spot.get("description") or ""
            spot_id = str(spot.get("id") or "")

            if raw_query and not any(k in raw_query for k in ["spot", "точк", "карт"]) and raw_query not in name.lower() and raw_query not in area.lower():
                continue

            yandex_nav_url = f"https://yandex.ru/maps/?rtext=~{lat}%2C{lon}&rtt=auto"

            spot_text = (
                f"📍 <b>Рыболовная точка: {name}</b>\n"
                f"🌊 <b>Акватория:</b> {area}\n"
                f"🧭 <b>GPS-координаты:</b> <code>{lat:.5f}, {lon:.5f}</code>\n"
                f"📝 <b>Описание:</b> {desc}\n\n"
                f"<blockquote expandable>🗺 <a href=\"{yandex_nav_url}\">Проложить маршрут в Яндекс.Картах</a>\n"
                f"Доступны спутниковые снимки ледовых полей и глубин.</blockquote>\n\n"
                f"<i>Точка доступна на спутниковой карте в Mini App:</i>"
            )

            results.append(
                InlineQueryResultArticle(
                    id=f"spot_{spot_id}",
                    title=f"📍 {name} ({area})",
                    description=f"GPS: {lat:.4f}, {lon:.4f} • Маршрут Яндекс.Карты",
                    input_message_content=InputTextMessageContent(
                        message_text=spot_text,
                        parse_mode="HTML",
                        disable_web_page_preview=True
                    ),
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[
                            [
                                InlineKeyboardButton(
                                    text="🗺 Открыть точку на карте",
                                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=spots")
                                ),
                                InlineKeyboardButton(
                                    text="🧭 Маршрут Яндекс",
                                    url=yandex_nav_url
                                )
                            ]
                        ]
                    )
                )
            )

        # 4. Quick Mini App launcher
        results.append(
            InlineQueryResultArticle(
                id="app_quick_share",
                title="🌊 Запустить Поморский Mini App во весь экран",
                description="Личный кабинет @EKlimov84, экипажи, авто, карта точек, бензин",
                input_message_content=InputTextMessageContent(
                    message_text=(
                        "🎣 <b>Поморское Приложение Рыбака (Архангельск & Северодвинск)</b>\n\n"
                        "• 🚗 Поиск экипажей (для водителей и пассажиров)\n"
                        "• ⛽️ Калькулятор бензина и распределения расходов\n"
                        "• 🗺 Интерактивная карта Яндекс со спутником и глубинами\n"
                        "• 🐟 Журнал уловов и трофеев\n\n"
                        "<i>Нажмите кнопку ниже для запуска Mini App:</i>"
                    ),
                    parse_mode="HTML"
                ),
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [
                            InlineKeyboardButton(
                                text="🌊 Открыть Mini App",
                                web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                            )
                        ],
                        [
                            InlineKeyboardButton(
                                text="➕ Добавить бота в группу",
                                url=f"https://t.me/{BOT_USERNAME}?startgroup=true"
                            )
                        ]
                    ]
                )
            )
        )

    except Exception as e:
        logger.exception("Error in inline query handler: %s", e)
        # Always return at least 1 safe result
        results = [
            InlineQueryResultArticle(
                id="fallback_app",
                title="🌊 Запустить Поморский Mini App",
                description="Открыть личный кабинет и карту рыбалки",
                input_message_content=InputTextMessageContent(
                    message_text="🎣 Нажмите кнопку ниже для запуска Mini App:",
                    parse_mode="HTML"
                ),
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [
                            InlineKeyboardButton(
                                text="🌊 Открыть приложение",
                                web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                            )
                        ]
                    ]
                )
            )
        ]

    await inline_query.answer(results=results, cache_time=1, is_personal=True)
