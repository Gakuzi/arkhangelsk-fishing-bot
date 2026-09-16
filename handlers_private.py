import json
import logging
from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
import database
import keyboards
from config import WEBAPP_URL, BOT_USERNAME

logger = logging.getLogger(__name__)
router = Router()

def format_car_card(user_id: int, name: str, username: str = ""):
    clean_u = (username or "").replace("@", "").lower().strip()
    # Prioritize Evgeny Klimov's real data if matches
    if clean_u == "eklimov84" or "климов" in name.lower() or "евгений" in name.lower():
        name = "Евгений Климов"
        clean_u = "EKlimov84"

    car = database.get_user_by_tg(str(user_id), clean_u)
    t_name = car.get("transport_name") or "УАЗ Патриот / Нива 4x4"
    f_type = car.get("fuel_type") or "АИ-92"
    try:
        f_cons = float(car.get("fuel_consumption") or 11.5)
    except (ValueError, TypeError):
        f_cons = 11.5
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

    card_text = (
        f"🚗 <b>Транспорт и экипаж: {name}</b> (@{clean_u or 'помор'})\n\n"
        f"• <b>Техника:</b> {t_name}\n"
        f"• <b>Топливо:</b> {f_type} (<code>{f_price:.1f} ₽/л</code>, расход <code>{f_cons:.1f} л/100км</code>)\n"
        f"• <b>Свободных мест:</b> <b>{free_seats} из {tot_seats}</b>\n"
        f"• <b>Себестоимость 1 км пути:</b> <code>{cost_per_km:.2f} ₽/км</code>\n\n"
        f"<blockquote expandable>👥 <b>Ориентир затрат на экипаж (туда-обратно):</b>\n"
        f"• 50 км = <b>{cost_per_km * 50:.0f} ₽</b> (по ~{(cost_per_km * 50) / max(1, tot_seats):.0f} ₽ с носа)\n"
        f"• 100 км = <b>{cost_per_km * 100:.0f} ₽</b> (по ~{(cost_per_km * 100) / max(1, tot_seats):.0f} ₽ с носа)\n"
        f"• 150 км = <b>{cost_per_km * 150:.0f} ₽</b> (по ~{(cost_per_km * 150) / max(1, tot_seats):.0f} ₽ с носа)</blockquote>\n\n"
        f"<i>Нажмите кнопку ниже, чтобы настроить параметры или поделиться в группе:</i>"
    )
    return card_text, cost_per_km

@router.message(F.chat.type == "private", CommandStart())
async def handle_start(message: Message):
    name = message.from_user.first_name if message.from_user else "Рыбак"
    username = (message.from_user.username or "") if message.from_user else ""
    if username.lower() == "eklimov84" or "климов" in name.lower() or "евгений" in name.lower():
        name = "Евгений Климов"
        username = "EKlimov84"

    # Save/ensure user in database
    if message.from_user:
        database.upsert_user(str(message.from_user.id), name, username)

    welcome_text = (
        f"👋 Здорово, <b>{name}</b>!\n\n"
        f"Добро пожаловать в <b>Поморский Рыболовный Клуб</b> (Архангельск, Белое Море, Северная Двина).\n\n"
        f"<blockquote expandable>✨ <b>Что умеет бот и Mini App:</b>\n"
        f"• <b>Экипажи и попутки:</b> публикуйте выезды как водитель с машиной или как пассажир без авто\n"
        f"• <b>Интерактивная карта:</b> точки лова, спутниковые снимки ледовых полей и глубин дельты Двины\n"
        f"• <b>Калькулятор бензина:</b> точный расчёт расхода и долей на экипаж\n"
        f"• <b>Инлайн-режим:</b> наберите <code>@{BOT_USERNAME}</code> в любом чате или ЛС для быстрой отправки выезда\n"
        f"• <b>Календарь:</b> добавление выездов в Google Календарь в один клик</blockquote>\n\n"
        f"Выберите раздел в меню снизу или запустите Mini App:"
    )

    # First ensure the persistent ReplyKeyboardMarkup is set
    await message.answer(
        "⚓️ <b>Меню быстрых команд закреплено внизу экрана!</b>",
        parse_mode="HTML",
        reply_markup=keyboards.get_main_reply_keyboard()
    )

    # Then send the main interactive card
    await message.answer(
        welcome_text,
        parse_mode="HTML",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

@router.message(F.chat.type == "private", Command(commands=["menu", "startmenu", "главная"]))
async def handle_menu_command(message: Message):
    await message.answer(
        "🎣 <b>Главное меню Поморского Рыбака:</b>\n"
        "Выберите раздел или воспользуйтесь постоянным меню внизу экрана:",
        parse_mode="HTML",
        reply_markup=keyboards.get_main_reply_keyboard()
    )
    await message.answer(
        "🌊 Нажмите для быстрого перехода:",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

@router.message(F.chat.type == "private", Command(commands=["app", "webapp"]))
@router.message(F.chat.type == "private", F.text == "🌊 Запустить Поморский Mini App")
async def handle_webapp_command(message: Message):
    await message.answer(
        "🌊 <b>Поморский Рыболовный Mini App:</b>\n\n"
        "• Личный кабинет, настройки авто, точки лова и экипажи\n"
        "Нажмите кнопку ниже для открытия во весь экран:",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="🌊 Открыть Поморский Mini App",
                        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                    )
                ]
            ]
        )
    )

@router.message(F.chat.type == "private", Command(commands=["car", "auto", "машина"]))
@router.message(F.chat.type == "private", F.text.startswith("🚗 Экипажи"))
@router.message(F.chat.type == "private", F.text == "🚗 Мой автомобиль")
async def handle_car_command(message: Message):
    user_id = message.from_user.id if message.from_user else 0
    name = message.from_user.first_name if message.from_user else "Рыбак"
    username = message.from_user.username or ""

    card_text, cost_per_km = format_car_card(user_id, name, username)
    await message.answer(
        card_text,
        parse_mode="HTML",
        reply_markup=keyboards.get_car_inline_keyboard(cost_per_km)
    )

@router.message(F.chat.type == "private", Command("fuel"))
@router.message(F.chat.type == "private", F.text.startswith("⛽️ Калькулятор"))
async def handle_fuel_command(message: Message):
    """Команда /fuel <расстояние в км> или нажатие на кнопку калькулятора"""
    args = message.text.split()[1:] if message.text and len(message.text.split()) > 1 else []
    user_id = message.from_user.id if message.from_user else 0
    username = message.from_user.username or ""
    car = database.get_user_by_tg(str(user_id), username)

    try:
        f_cons = float(car.get("fuel_consumption") or 11.5)
    except (ValueError, TypeError):
        f_cons = 11.5
    try:
        f_price = float(car.get("fuel_price") or 56.5)
    except (ValueError, TypeError):
        f_price = 56.5
    try:
        seats = int(car.get("total_seats") or 4)
    except (ValueError, TypeError):
        seats = 4

    cost_per_km = (f_cons / 100.0) * f_price

    if not args or not args[0].replace(".", "").isdigit():
        text = (
            f"⛽️ <b>Калькулятор топлива для поездки на рыбалку:</b>\n\n"
            f"• Расход авто: <code>{f_cons:.1f} л/100км</code> ({car.get('transport_name', 'Авто')})\n"
            f"• Цена бензина: <code>{f_price:.1f} ₽/л</code> ({car.get('fuel_type', 'АИ-92')})\n"
            f"• Себестоимость километра: <code>{cost_per_km:.2f} ₽/км</code>\n\n"
            f"<blockquote expandable>💡 <b>Быстрый расчёт:</b>\n"
            f"Отправьте боту команду с километражем, например: <code>/fuel 120</code> или просто напишите число <code>120</code> в чат.</blockquote>\n\n"
            f"Либо выберите готовое расстояние:"
        )
        await message.answer(text, parse_mode="HTML", reply_markup=keyboards.get_car_inline_keyboard(cost_per_km))
        return

    km = float(args[0])
    total_fuel_cost = km * cost_per_km
    cost_2 = total_fuel_cost / 2.0
    cost_3 = total_fuel_cost / 3.0
    cost_4 = total_fuel_cost / max(1, seats)

    calc_text = (
        f"⛽️ <b>Расчёт поездки на {km:.0f} км ({car.get('transport_name', 'Авто')}):</b>\n\n"
        f"• Общая сумма на бензин: <b>{total_fuel_cost:.0f} ₽</b>\n"
        f"<blockquote expandable>👥 <b>Разбивка на экипаж:</b>\n"
        f"• Вдвоём: по <b>{cost_2:.0f} ₽</b> с человека\n"
        f"• Втроём: по <b>{cost_3:.0f} ₽</b> с человека\n"
        f"• Вчетвером: по <b>{cost_4:.0f} ₽</b> с человека</blockquote>\n\n"
        f"<i>Рассчитано по нормативу {f_cons:.1f} л/100км ({car.get('fuel_type', 'АИ-92')})</i>"
    )
    await message.answer(calc_text, parse_mode="HTML", reply_markup=keyboards.get_car_inline_keyboard(cost_per_km))

@router.message(F.chat.type == "private", Command("profile"))
@router.message(F.chat.type == "private", F.text.startswith("👤 Мой профиль"))
async def handle_profile_command(message: Message):
    user_id = message.from_user.id if message.from_user else 0
    name = message.from_user.first_name if message.from_user else "Евгений Климов"
    username = (message.from_user.username or "") if message.from_user else "EKlimov84"

    if username.lower() == "eklimov84" or "климов" in name.lower() or "евгений" in name.lower():
        name = "Евгений Климов"
        username = "EKlimov84"

    car = database.get_user_by_tg(str(user_id), username)

    prof_text = (
        f"👤 <b>Личный кабинет рыбака: {name}</b> (@{username})\n\n"
        f"• <b>Статус:</b> Бывалый помор • Архангельск\n"
        f"• <b>Транспорт:</b> {car.get('transport_name', 'УАЗ Патриот / Нива')}\n"
        f"• <b>Мест в машине:</b> {car.get('total_seats', 4)} (свободно {car.get('available_seats', 3)})\n"
        f"• <b>Топливо:</b> {car.get('fuel_type', 'АИ-92')} (расход {car.get('fuel_consumption', 11.5)} л/100км)\n\n"
        f"<blockquote expandable>⚙️ Все параметры автомобиля, снастей и контактов синхронизированы с базой данных и доступны для редактирования в Mini App.</blockquote>\n\n"
        f"<i>Нажмите кнопку ниже для настройки профиля:</i>"
    )

    await message.answer(
        prof_text,
        parse_mode="HTML",
        reply_markup=keyboards.get_profile_keyboard()
    )

@router.message(F.chat.type == "private", Command("history"))
@router.message(F.chat.type == "private", F.text.startswith("🐟 Журнал"))
async def handle_history_command(message: Message):
    await message.answer(
        "🐟 <b>Журнал рыбалок и трофеев Поморья:</b>\n\n"
        "Здесь фиксируются уловы (навага, корюшка, сиг, окунь), вес, снасти и погода.\n"
        "Отчёты сохраняются в базу данных.",
        parse_mode="HTML",
        reply_markup=keyboards.get_history_keyboard()
    )

@router.message(F.chat.type == "private", Command("spots"))
@router.message(F.chat.type == "private", F.text.startswith("🗺 Карта"))
async def handle_spots_command(message: Message):
    spots = database.get_spots()
    text = "📍 <b>Проверенные рыбные точки Поморья (Яндекс.Карты):</b>\n\n"
    for s in spots[:4]:
        lat = s.get('lat', 64.8820)
        lon = s.get('lon', 40.2910)
        yandex_url = f"https://yandex.ru/maps/?rtext=~{lat}%2C{lon}&rtt=auto"
        text += (
            f"• <b>{s.get('name', 'Точка')}</b> ({s.get('area', 'Белое море')})\n"
            f"  GPS: <code>{lat:.4f}, {lon:.4f}</code> | <a href=\"{yandex_url}\">Маршрут</a>\n"
        )

    text += "\n<blockquote expandable>Карта поддерживает слои Спутник, Схема и Гибрид для просмотра ледовых полей.</blockquote>"

    await message.answer(
        text,
        parse_mode="HTML",
        disable_web_page_preview=True,
        reply_markup=keyboards.get_spots_keyboard()
    )

@router.message(F.chat.type == "private", Command("trips"))
async def handle_trips_command(message: Message):
    trips = database.get_trips()
    if not trips:
        await message.answer(
            "📅 Пока нет открытых выездов.\nСоздайте поездку в Mini App — можно как с машиной, так и без авто (в поиске водителя)!",
            reply_markup=keyboards.get_trips_keyboard()
        )
        return

    text = "📅 <b>Ближайшие запланированные выезды:</b>\n\n"
    for t in trips[:4]:
        parts = t.get("participants", [])
        max_crew = int(t.get("max_crew") or 4)
        free = max(0, max_crew - len(parts))
        text += (
            f"🎣 <b>{t.get('title', 'Выезд')}</b>\n"
            f"📍 {t.get('destination', '')} | 📅 {t.get('date', '')} в {t.get('meet_time', '')}\n"
            f"👥 Свободно мест: <b>{free}/{max_crew}</b> (Капитан: {t.get('organizer_name', 'Организатор')})\n\n"
        )
    await message.answer(text, parse_mode="HTML", reply_markup=keyboards.get_trips_keyboard())

# --- Location Handler (Native Telegram GPS) ---
@router.message(F.chat.type == "private", F.location)
async def handle_user_location(message: Message):
    loc = message.location
    lat = loc.latitude
    lon = loc.longitude

    yandex_route = f"https://yandex.ru/maps/?rtext=~{lat}%2C{lon}&rtt=auto"
    yandex_pin = f"https://yandex.ru/maps/?pt={lon},{lat}&z=14&l=sat"

    text = (
        f"📍 <b>Координаты получены с вашего устройства!</b>\n\n"
        f"• Широта (Lat): <code>{lat:.6f}</code>\n"
        f"• Долгота (Lon): <code>{lon:.6f}</code>\n\n"
        f"<blockquote expandable>🗺 <b>Ссылки на карту:</b>\n"
        f"• <a href=\"{yandex_pin}\">Посмотреть точку на спутнике Яндекс</a>\n"
        f"• <a href=\"{yandex_route}\">Проложить автомобильный маршрут</a></blockquote>\n\n"
        f"<i>Вы можете использовать эти координаты при создании выезда в Mini App:</i>"
    )

    await message.answer(
        text,
        parse_mode="HTML",
        disable_web_page_preview=True,
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="🗺 Открыть карту в Mini App",
                        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=spots&lat={lat}&lon={lon}")
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🚗 Запланировать выезд сюда",
                        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips&destLat={lat}&destLon={lon}")
                    )
                ]
            ]
        )
    )

# --- Universal Natural Language Text Handler ---
@router.message(F.chat.type == "private", F.text)
async def handle_user_free_text(message: Message):
    text = (message.text or "").strip()
    low = text.lower()

    # If user sent pure number -> treat as km for fuel calculator
    clean_num = text.replace("км", "").replace("km", "").strip()
    if clean_num.isdigit():
        km = float(clean_num)
        user_id = message.from_user.id if message.from_user else 0
        username = message.from_user.username or ""
        car = database.get_user_by_tg(str(user_id), username)
        try:
            f_cons = float(car.get("fuel_consumption") or 11.5)
        except (ValueError, TypeError):
            f_cons = 11.5
        try:
            f_price = float(car.get("fuel_price") or 56.5)
        except (ValueError, TypeError):
            f_price = 56.5
        tot_seats = int(car.get("total_seats") or 4)

        cost_per_km = (f_cons / 100.0) * f_price
        total_fuel = km * cost_per_km
        per_person = total_fuel / max(1, tot_seats)

        calc_text = (
            f"⛽️ <b>Расчёт на {km:.0f} км ({car.get('transport_name', 'Авто')}):</b>\n\n"
            f"• Итого бензин: <b>{total_fuel:.0f} ₽</b>\n"
            f"• С каждого в экипаже из {tot_seats} чел.: <b>{per_person:.0f} ₽</b>\n"
            f"• С каждого вдвоём: <b>{(total_fuel / 2):.0f} ₽</b>"
        )
        await message.answer(calc_text, parse_mode="HTML", reply_markup=keyboards.get_car_inline_keyboard(cost_per_km))
        return

    # If user asked about spots or areas
    matching_spots = [
        s for s in database.get_spots()
        if s.get("name", "").lower() in low or s.get("area", "").lower() in low or low in s.get("name", "").lower()
    ]
    if matching_spots:
        s = matching_spots[0]
        lat = s.get("lat", 64.8820)
        lon = s.get("lon", 40.2910)
        yandex_url = f"https://yandex.ru/maps/?rtext=~{lat}%2C{lon}&rtt=auto"
        ans = (
            f"📍 <b>Найдена точка: {s.get('name')}</b> ({s.get('area')})\n\n"
            f"• GPS: <code>{lat:.4f}, {lon:.4f}</code>\n"
            f"• Описание: {s.get('description', 'Отличное место')}\n"
            f"• Рекомендуемая рыба: {s.get('recommended_fish', 'Навага, Корюшка')}\n\n"
            f"<blockquote expandable>🗺 <a href=\"{yandex_url}\">Открыть маршрут в Яндекс.Картах</a></blockquote>"
        )
        await message.answer(
            ans,
            parse_mode="HTML",
            disable_web_page_preview=True,
            reply_markup=keyboards.get_spots_keyboard()
        )
        return

    # If general question or greeting
    user_name = message.from_user.first_name if message.from_user else "Рыбак"
    response_text = (
        f"🎣 <b>{user_name}</b>, принял ваше сообщение: <i>«{text}»</i>\n\n"
        f"Чтобы спланировать рыбалку или рассчитать бензин, используйте кнопки ниже или введите команду:\n"
        f"• <code>/fuel 120</code> — рассчитать бензин на 120 км\n"
        f"• <code>/spots</code> — список клевых мест\n"
        f"• <code>/profile</code> — личный кабинет и авто\n\n"
        f"Или нажмите кнопку для открытия Mini App:"
    )
    await message.answer(
        response_text,
        parse_mode="HTML",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

# --- Callbacks ---
@router.callback_query(F.data == "btn_car")
async def handle_callback_car(call: CallbackQuery):
    user_id = call.from_user.id if call.from_user else 0
    name = call.from_user.first_name if call.from_user else "Рыбак"
    username = call.from_user.username or ""
    card_text, cost_per_km = format_car_card(user_id, name, username)
    await call.answer()
    if call.message:
        await call.message.reply(card_text, parse_mode="HTML", reply_markup=keyboards.get_car_inline_keyboard(cost_per_km))

@router.callback_query(F.data.startswith("calc_km:"))
async def handle_callback_calc_km(call: CallbackQuery):
    km_str = call.data.split(":")[1]
    km = float(km_str)
    user_id = call.from_user.id if call.from_user else 0
    username = call.from_user.username or ""
    car = database.get_user_by_tg(str(user_id), username)

    try:
        f_cons = float(car.get("fuel_consumption") or 11.5)
    except (ValueError, TypeError):
        f_cons = 11.5
    try:
        f_price = float(car.get("fuel_price") or 56.5)
    except (ValueError, TypeError):
        f_price = 56.5
    try:
        seats = int(car.get("total_seats") or 4)
    except (ValueError, TypeError):
        seats = 4

    cost_per_km = (f_cons / 100.0) * f_price
    total = km * cost_per_km
    per_person = total / max(1, seats)

    text = (
        f"⛽️ <b>Расчёт на {km:.0f} км ({car.get('transport_name', 'Авто')}):</b>\n\n"
        f"• Всего на топливо: <b>{total:.0f} ₽</b>\n"
        f"• При экипаже в {seats} чел.: <b>{per_person:.0f} ₽ с носа</b>\n"
        f"• При экипаже в 2 чел.: <b>{(total / 2):.0f} ₽ с носа</b>"
    )
    await call.answer(f"Итого: {total:.0f} ₽", show_alert=False)
    if call.message:
        await call.message.reply(text, parse_mode="HTML")

@router.callback_query(F.data == "btn_spots")
async def handle_callback_spots(call: CallbackQuery):
    await call.answer()
    if call.message:
        await call.message.reply(
            "🗺 Координаты точек и карта Поморья доступны в веб-приложении:",
            reply_markup=keyboards.get_spots_keyboard()
        )

@router.callback_query(F.data == "btn_trips")
async def handle_callback_trips(call: CallbackQuery):
    await call.answer()
    if call.message:
        await call.message.reply(
            "📅 Запланированные выезды и бронирование мест:",
            reply_markup=keyboards.get_trips_keyboard()
        )

@router.callback_query(F.data == "btn_history")
async def handle_callback_history(call: CallbackQuery):
    await call.answer()
    if call.message:
        await call.message.reply(
            "🐟 Отчеты об уловах и трофеи доступны в WebApp:",
            reply_markup=keyboards.get_history_keyboard()
        )

@router.callback_query(F.data.startswith("trip_join:"))
async def handle_trip_join_callback(call: CallbackQuery):
    trip_id = call.data.split(":")[1]
    user_id = str(call.from_user.id)
    user_name = call.from_user.first_name or "Рыбак"
    username = call.from_user.username or ""

    res = database.join_trip_db(trip_id, user_id, user_name, username)
    await call.answer(res["message"], show_alert=True)
    if res.get("success") and call.message:
        await call.message.reply(
            f"🎉 <b>{user_name}</b>, вы успешно записались в экипаж!",
            parse_mode="HTML"
        )

@router.callback_query(F.data.startswith("trip_decline:"))
async def handle_trip_decline_callback(call: CallbackQuery):
    trip_id = call.data.split(":")[1]
    user_id = str(call.from_user.id)
    res = database.leave_trip_db(trip_id, user_id)
    await call.answer(res["message"], show_alert=False)
