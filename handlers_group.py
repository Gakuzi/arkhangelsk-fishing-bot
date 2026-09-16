from aiogram import Router, F
from aiogram.types import (
    Message,
    CallbackQuery,
    ReactionTypeEmoji,
    ChatMemberUpdated,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo
)
from aiogram.filters import Command
import database
import keyboards
from config import WEBAPP_URL, BOT_USERNAME

router = Router()

@router.my_chat_member()
async def handle_bot_added_to_chat(event: ChatMemberUpdated):
    """Срабатывает при добавлении бота в группу, супергруппу или канал"""
    new_status = event.new_chat_member.status
    if new_status in ["member", "administrator"]:
        chat_title = event.chat.title or "этом чате"
        welcome_text = (
            f"⚓️ <b>Поморский Рыболовный Бот активирован в {chat_title}!</b>\n\n"
            f"Теперь в этом чате доступны:\n"
            f"• 🚗 <b>/car</b> — карточка авто и расчёт бензина на экипаж\n"
            f"• ⛽️ <b>/fuel 150</b> — моментальный расчёт затрат на бензин на поездку\n"
            f"• 📅 <b>/trips</b> — запланированные выезды и запись в экипаж кнопками\n"
            f"• 📍 <b>/spots</b> — точки лова на Яндекс.Картах\n"
            f"• 🌊 <b>/app</b> — открытие Mini App во весь экран\n\n"
            f"<blockquote>💡 <b>Инлайн-режим:</b> наберите <code>@{BOT_USERNAME}</code> в строке ввода, чтобы скинуть карточку машины, точку или выезд прямо в переписку!</blockquote>"
        )
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="🌊 Открыть Приложение Рыбака",
                        web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="📤 Отправить карточку авто",
                        switch_inline_query="car"
                    ),
                    InlineKeyboardButton(
                        text="📅 Собрать экипаж",
                        switch_inline_query="trips"
                    )
                ]
            ]
        )
        try:
            await event.bot.send_message(
                chat_id=event.chat.id,
                text=welcome_text,
                parse_mode="HTML",
                reply_markup=keyboard
            )
        except Exception as e:
            print(f"[Group] Error sending welcome message: {e}")

@router.message(F.chat.type.in_(["group", "supergroup"]), Command(commands=["app", "webapp"]))
async def handle_group_webapp_cmd(message: Message):
    """Вызов меню WebApp в группе"""
    await message.reply(
        "🎣 <b>Поморское Приложение Рыбака:</b>\n"
        "Личный кабинет, карта глубин, точки лова и экипажи:",
        parse_mode="HTML",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

@router.message(F.chat.type.in_(["group", "supergroup"]), Command(commands=["car", "auto", "машина"]))
async def handle_group_car_cmd(message: Message):
    """Карточка автомобиля участника в группе"""
    user_id = message.from_user.id if message.from_user else 0
    first_name = message.from_user.first_name if message.from_user else "Рыбак"
    username = message.from_user.username or ""

    car = database.get_user_by_tg(str(user_id), username)
    t_name = car.get("transport_name", "Нива 4x4 / УАЗ")
    f_type = car.get("fuel_type", "АИ-92")
    f_cons = float(car.get("fuel_consumption", 10.5))
    f_price = float(car.get("fuel_price", 56.5))
    tot_seats = int(car.get("total_seats", 4))
    free_seats = int(car.get("available_seats", 3))
    cost_per_km = (f_cons / 100.0) * f_price

    card_text = (
        f"🚗 <b>Транспорт рыбака: {first_name}</b>\n\n"
        f"• <b>Техника:</b> {t_name}\n"
        f"• <b>Топливо:</b> {f_type} (<code>{f_price:.1f} ₽/л</code>, расход <code>{f_cons:.1f} л/100км</code>)\n"
        f"• <b>Свободных мест:</b> <b>{free_seats}</b> из {tot_seats}\n"
        f"• <b>Себестоимость:</b> <code>{cost_per_km:.2f} ₽/км</code>\n\n"
        f"<blockquote>⛽️ <b>Расклад по бензину:</b>\n"
        f"• 100 км = <b>{cost_per_km * 100:.0f} ₽</b> (по ~{(cost_per_km * 100) / max(1, tot_seats):.0f} ₽/чел)\n"
        f"• 150 км = <b>{cost_per_km * 150:.0f} ₽</b> (по ~{(cost_per_km * 150) / max(1, tot_seats):.0f} ₽/чел)</blockquote>\n\n"
        f"<i>Используйте <code>/fuel 100</code> для быстрого расчёта другой дистанции.</i>"
    )

    reply_markup = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📱 Открыть в Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                ),
                InlineKeyboardButton(
                    text="⛽️ Рассчитать км",
                    switch_inline_query_current_chat="120"
                )
            ],
            [
                InlineKeyboardButton(
                    text="📅 Собрать выезд с этим авто",
                    switch_inline_query="trips"
                )
            ]
        ]
    )
    await message.reply(card_text, parse_mode="HTML", reply_markup=reply_markup)

@router.message(F.chat.type.in_(["group", "supergroup"]), Command("fuel"))
async def handle_group_fuel_cmd(message: Message):
    """Расчёт бензина на экипаж в группе: /fuel 120"""
    args = message.text.split()[1:] if message.text else []
    user_id = message.from_user.id if message.from_user else 0
    username = message.from_user.username or ""
    car = database.get_user_by_tg(str(user_id), username)

    f_cons = float(car.get("fuel_consumption", 10.5))
    f_price = float(car.get("fuel_price", 56.5))
    cost_per_km = (f_cons / 100.0) * f_price
    seats = int(car.get("total_seats", 4))

    if not args or not args[0].isdigit():
        await message.reply(
            "⛽️ <b>Калькулятор топлива для экипажа:</b>\n"
            "Укажите расстояние в км, например: <code>/fuel 120</code>",
            parse_mode="HTML"
        )
        return

    km = float(args[0])
    total_fuel_cost = km * cost_per_km
    cost_2 = total_fuel_cost / 2.0
    cost_3 = total_fuel_cost / 3.0
    cost_4 = total_fuel_cost / max(1, seats)

    calc_text = (
        f"⛽️ <b>Расчёт поездки на {km:.0f} км ({car.get('transport_name', 'Авто')}):</b>\n\n"
        f"• Итого на топливо: <b>{total_fuel_cost:.0f} ₽</b> ({f_cons:.1f} л/100км, {f_price:.1f} ₽/л)\n\n"
        f"<blockquote>👥 <b>Скидываемся на бензин:</b>\n"
        f"• На двоих: по <b>{cost_2:.0f} ₽</b>\n"
        f"• На троих: по <b>{cost_3:.0f} ₽</b>\n"
        f"• На {seats} чел.: по <b>{cost_4:.0f} ₽</b> с каждого</blockquote>"
    )
    await message.reply(calc_text, parse_mode="HTML")

@router.message(F.chat.type.in_(["group", "supergroup"]), Command(commands=["trips", "выезды"]))
async def handle_group_trips_cmd(message: Message):
    """Показать список запланированных рыбалок в группе с кнопками записи"""
    trips = database.get_trips()
    if not trips:
        await message.reply(
            "📅 Пока нет запланированных рыбалок.\n"
            "Вы можете создать новый выезд через WebApp или инлайн-режим!",
            reply_markup=keyboards.get_trips_keyboard()
        )
        return

    text = "📅 <b>Ближайшие запланированные выезды на рыбалку:</b>\n\n"
    for t in trips[:3]:
        parts_count = len(t.get("participants", []))
        max_crew = t.get("max_crew", 4)
        free = max(0, max_crew - parts_count)
        text += (
            f"• <b>{t['title']}</b>\n"
            f"  📍 {t['destination']} | 🕒 {t['date']} в {t.get('meet_time', '')}\n"
            f"  👥 Мест свободно: <b>{free} из {max_crew}</b> (Капитан: {t.get('organizer_name', 'Рыбак')})\n\n"
        )

    text += "<i>Нажмите кнопку ниже, чтобы открыть карточки выездов:</i>"
    await message.reply(text, parse_mode="HTML", reply_markup=keyboards.get_trips_keyboard())

@router.message(F.chat.type.in_(["group", "supergroup"]), Command(commands=["spots", "точки"]))
async def handle_group_spots_cmd(message: Message):
    """Показать точки лова в группе"""
    spots = database.get_spots()
    text = "📍 <b>Популярные рыбные точки на Двине и Белом море (Яндекс.Карты):</b>\n\n"
    for s in spots[:4]:
        text += f"• <b>{s['name']}</b> ({s['area']})\n  Координаты: <code>{s['lat']}, {s['lon']}</code>\n"

    text += "\n<i>Все координаты сохранены на спутниковой карте:</i>"
    await message.reply(text, parse_mode="HTML", reply_markup=keyboards.get_spots_keyboard())

@router.message(F.chat.type.in_(["group", "supergroup"]), F.location)
async def handle_group_location(message: Message):
    """Обработка координат отправленных в группу"""
    user = message.from_user.first_name if message.from_user else "Рыбак"
    username = message.from_user.username or ""
    lat = message.location.latitude
    lon = message.location.longitude

    spot_name = f"Точка от {user}"
    database.add_spot(
        name=spot_name,
        lat=lat,
        lon=lon,
        area="Северная Двина / Приморский район",
        added_by=f"@{username}" if username else user,
        description="Передано из группы Telegram"
    )
    database.add_log(user, f"Отправил координаты: {lat}, {lon}", log_type="location")

    await message.reply(
        f"📍 <b>{user}</b>, точка сохранена в общую базу!\nКоординаты: <code>{lat:.5f}, {lon:.5f}</code>\n"
        f"<i>Координаты внесены в базу и отображаются на спутниковой карте WebApp.</i>",
        parse_mode="HTML",
        reply_markup=keyboards.get_spots_keyboard()
    )

@router.message(F.chat.type.in_(["group", "supergroup"]), F.text)
async def handle_group_message(message: Message):
    """Реакция 👀 и логирование сообщений в общий журнал рыбаков"""
    if message.text and message.text.startswith('/'):
        return

    user = message.from_user.first_name if message.from_user else "Рыбак"
    text = message.text

    try:
        await message.react([ReactionTypeEmoji(emoji="👀")])
    except Exception:
        pass

    database.add_log(user, text, log_type="text")

# --- Callbacks in Groups ---
@router.callback_query(F.data.startswith("trip_join:"))
async def handle_trip_join_callback(call: CallbackQuery):
    trip_id = call.data.split(":", 1)[1]
    user_id = str(call.from_user.id)
    user_name = call.from_user.first_name or "Рыбак"
    username = call.from_user.username or ""

    res = database.join_trip_db(trip_id, user_id, user_name, username)
    await call.answer(res.get("message", "Обработано!"), show_alert=True)
    if res.get("success") and call.message:
        await call.message.reply(
            f"🔥 <b>{user_name}</b> записался в экипаж!\n{res['message']}",
            parse_mode="HTML"
        )

@router.callback_query(F.data.startswith("trip_decline:"))
async def handle_trip_decline_callback(call: CallbackQuery):
    trip_id = call.data.split(":", 1)[1]
    user_id = str(call.from_user.id)
    user_name = call.from_user.first_name or "Рыбак"

    res = database.leave_trip_db(trip_id, user_id)
    await call.answer(res.get("message", "Отказ зафиксирован!"), show_alert=False)
    if res.get("success") and call.message:
        await call.message.reply(
            f"🫡 <b>{user_name}</b> покинул экипаж.",
            parse_mode="HTML"
        )
