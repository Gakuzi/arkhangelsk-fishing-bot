import json
from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, CallbackQuery
import keyboards
import database
from config import WEBAPP_URL, BOT_USERNAME

router = Router()

def format_car_card(user_id: int, first_name: str, username: str = "") -> tuple[str, float]:
    car = database.get_user_by_tg(str(user_id), username)
    t_name = car.get("transport_name", "Нива 4x4 / УАЗ")
    f_type = car.get("fuel_type", "АИ-92")
    f_cons = float(car.get("fuel_consumption", 10.5))
    f_price = float(car.get("fuel_price", 56.5))
    tot_seats = int(car.get("total_seats", 4))
    free_seats = int(car.get("available_seats", 3))

    cost_per_km = (f_cons / 100.0) * f_price

    card_text = (
        f"🚗 <b>Автомобиль и транспорт рыбака:</b>\n\n"
        f"• <b>Модель / Техника:</b> {t_name}\n"
        f"• <b>Топливо:</b> {f_type} (<code>{f_price:.1f} ₽/л</code>)\n"
        f"• <b>Расход на 100 км:</b> <code>{f_cons:.1f} л</code>\n"
        f"• <b>Вместимость:</b> всего мест {tot_seats} (свободно в экипаж: <b>{free_seats}</b>)\n\n"
        f"<blockquote>⛽️ <b>Себестоимость хода:</b> <code>{cost_per_km:.2f} ₽/км</code>\n"
        f"• 100 км пути = <b>{cost_per_km * 100:.0f} ₽</b> (по ~{(cost_per_km * 100) / max(1, tot_seats):.0f} ₽ на чел.)\n"
        f"• 150 км пути = <b>{cost_per_km * 150:.0f} ₽</b> (по ~{(cost_per_km * 150) / max(1, tot_seats):.0f} ₽ на чел.)</blockquote>\n\n"
        f"<i>Параметры можно изменить в личном кабинете Mini App:</i>"
    )
    return card_text, cost_per_km

@router.message(F.chat.type == "private", CommandStart())
async def handle_start(message: Message):
    user = message.from_user.first_name if message.from_user else "Рыбак"

    welcome_text = (
        f"👋 Здорово, <b>{user}</b>!\n\n"
        f"Добро пожаловать в <b>Поморский Рыболовный Бот</b> (Архангельск, Белое Море, Северная Двина).\n\n"
        f"<blockquote>💡 <b>Новые возможности бота:</b>\n"
        f"• <b>Инлайн-режим:</b> наберите <code>@{BOT_USERNAME}</code> в ЛЮБОМ чате или группе, чтобы поделиться машиной, точкой или выездом!\n"
        f"• <b>Автомобиль и бензин:</b> команда <code>/car</code> или <code>/fuel 120</code> для быстрого расчёта расходов на экипаж\n"
        f"• <b>Личный кабинет:</b> кнопка «Меню Рыбака» или ссылка ниже открывает Mini App без перезагрузки</blockquote>\n\n"
        f"Выберите нужное действие ниже:"
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

@router.message(F.chat.type == "private", Command(commands=["car", "auto", "машина"]))
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
async def handle_fuel_command(message: Message):
    """Команда /fuel <расстояние в км>"""
    args = message.text.split()[1:] if message.text else []
    user_id = message.from_user.id if message.from_user else 0
    username = message.from_user.username or ""
    car = database.get_user_by_tg(str(user_id), username)

    f_cons = float(car.get("fuel_consumption", 10.5))
    f_price = float(car.get("fuel_price", 56.5))
    cost_per_km = (f_cons / 100.0) * f_price
    seats = int(car.get("total_seats", 4))

    if not args or not args[0].isdigit():
        text = (
            f"⛽️ <b>Калькулятор топлива для экипажа:</b>\n"
            f"Использование: <code>/fuel 120</code> (где 120 — расстояние в оба конца в км)\n\n"
            f"Текущие параметры авто:\n"
            f"• Расход: <code>{f_cons:.1f} л/100км</code>\n"
            f"• Цена бензина: <code>{f_price:.1f} ₽/л</code>\n"
            f"• Стоимость 1 км: <code>{cost_per_km:.2f} ₽/км</code>"
        )
        await message.answer(text, parse_mode="HTML", reply_markup=keyboards.get_car_inline_keyboard(cost_per_km))
        return

    km = float(args[0])
    total_fuel_cost = km * cost_per_km
    cost_2 = total_fuel_cost / 2.0
    cost_3 = total_fuel_cost / 3.0
    cost_4 = total_fuel_cost / max(1, seats)

    calc_text = (
        f"⛽️ <b>Расчёт поездки на {km:.0f} км:</b>\n\n"
        f"• Общая сумма на бензин: <b>{total_fuel_cost:.0f} ₽</b>\n"
        f"<blockquote>👥 <b>Разбивка на экипаж:</b>\n"
        f"• На двоих: по <b>{cost_2:.0f} ₽</b> с человека\n"
        f"• На троих: по <b>{cost_3:.0f} ₽</b> с человека\n"
        f"• На {seats} чел.: по <b>{cost_4:.0f} ₽</b> с человека</blockquote>\n\n"
        f"<i>Рассчитано по расходу {f_cons:.1f} л/100км ({car.get('fuel_type', 'АИ-92')})</i>"
    )
    await message.answer(calc_text, parse_mode="HTML", reply_markup=keyboards.get_car_inline_keyboard(cost_per_km))

@router.message(F.chat.type == "private", Command("profile"))
async def handle_profile_command(message: Message):
    await message.answer(
        "👤 <b>Личный кабинет рыбака:</b>\nНастройте вашу технику, снасти, стаж и район лова:",
        parse_mode="HTML",
        reply_markup=keyboards.get_profile_keyboard()
    )

@router.message(F.chat.type == "private", Command("history"))
@router.message(F.chat.type == "private", F.text == "🐟 Журнал уловов")
async def handle_history_command(message: Message):
    await message.answer(
        "🐟 <b>Журнал рыбалок:</b>\nОтчеты об уловах, фото трофеев и снасти:",
        parse_mode="HTML",
        reply_markup=keyboards.get_history_keyboard()
    )

@router.message(F.chat.type == "private", Command("spots"))
@router.message(F.chat.type == "private", F.text == "🗺 Точки лова")
async def handle_spots_command(message: Message):
    spots = database.get_spots()
    text = "📍 <b>Популярные рыбные точки Поморья (Яндекс.Карты):</b>\n\n"
    for s in spots[:4]:
        text += f"• <b>{s['name']}</b> ({s['area']})\n  Координаты: <code>{s['lat']}, {s['lon']}</code>\n"

    await message.answer(
        text,
        parse_mode="HTML",
        reply_markup=keyboards.get_spots_keyboard()
    )

@router.message(F.chat.type == "private", Command("trips"))
@router.message(F.chat.type == "private", F.text == "📅 Запланированные выезды")
async def handle_trips_command(message: Message):
    trips = database.get_trips()
    if not trips:
        await message.answer(
            "📅 Пока нет запланированных выездов.\nСоздайте поездку в Mini App или соберите экипаж!",
            reply_markup=keyboards.get_trips_keyboard()
        )
        return

    text = "📅 <b>Ближайшие запланированные выезды:</b>\n\n"
    for t in trips[:3]:
        parts = t.get("participants", [])
        free = max(0, t.get("max_crew", 4) - len(parts))
        text += (
            f"🎣 <b>{t['title']}</b>\n"
            f"📍 {t['destination']} | {t['date']} в {t.get('meet_time', '')}\n"
            f"👥 Свободно мест: <b>{free}</b> (Организатор: {t.get('organizer_name', 'Капитан')})\n\n"
        )
    await message.answer(text, parse_mode="HTML", reply_markup=keyboards.get_trips_keyboard())

# --- Callback Queries ---
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

    f_cons = float(car.get("fuel_consumption", 10.5))
    f_price = float(car.get("fuel_price", 56.5))
    cost_per_km = (f_cons / 100.0) * f_price
    seats = int(car.get("total_seats", 4))

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

@router.message(F.chat.type == "private", F.web_app_data)
async def handle_web_app_data(message: Message):
    """Обработка данных, переданных из Telegram Mini App (sendData)"""
    user = message.from_user.first_name if message.from_user else "Рыбак"
    raw_data = message.web_app_data.data

    try:
        payload = json.loads(raw_data)
        action = payload.get("action", "unknown")

        if action == "update_car":
            car_data = payload.get("car", {})
            user_id = str(message.from_user.id)
            database.update_user_car(
                user_id=user_id,
                transport_name=car_data.get("transportName", "Авто"),
                fuel_type=car_data.get("fuelType", "АИ-92"),
                fuel_consumption=float(car_data.get("fuelConsumption", 10.0)),
                fuel_price=float(car_data.get("fuelPrice", 56.5)),
                total_seats=int(car_data.get("totalSeats", 4)),
                available_seats=int(car_data.get("availableSeats", 3))
            )
            await message.reply(
                f"🚗 <b>Параметры авто сохранены!</b>\n"
                f"Модель: <b>{car_data.get('transportName')}</b>\n"
                f"Расход: <b>{car_data.get('fuelConsumption')} л/100км</b> ({car_data.get('fuelType')})\n\n"
                f"Теперь вы можете быстро скидывать карточку авто в чат через <code>@{BOT_USERNAME}</code> или команду <code>/car</code>.",
                parse_mode="HTML"
            )

        elif action == "join_crew":
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
                f"Запись внесена в ваш личный дневник!",
                parse_mode="HTML"
            )

        else:
            database.add_log(user, f"Данные из WebApp: {raw_data}", log_type="system")
            await message.reply("✅ Действие в приложении зафиксировано!")

    except Exception as e:
        database.add_log(user, f"Ошибка парсинга WebApp данных: {e}", log_type="system")
        await message.reply("✅ Данные приняты!")

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
        f"Точка внесена в базу и отображается на Яндекс.Картах в Веб-приложении:",
        parse_mode="HTML",
        reply_markup=keyboards.get_spots_keyboard()
    )
