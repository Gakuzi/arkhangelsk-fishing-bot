from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, ReactionTypeEmoji
from aiogram.filters import Command
import database
import keyboards

router = Router()

@router.message(F.chat.type.in_(["group", "supergroup"]), Command(commands=["app", "webapp"]))
async def handle_group_webapp_cmd(message: Message):
    """Вызов меню WebApp в группе"""
    await message.reply(
        "🎣 <b>Поморское Приложение Рыбака:</b>\n"
        "Карта глубин, приливы, запланированные рыбалки и экипажи:",
        parse_mode="HTML",
        reply_markup=keyboards.get_webapp_inline_keyboard()
    )

@router.message(F.chat.type.in_(["group", "supergroup"]), Command(commands=["trips", "выезды"]))
async def handle_group_trips_cmd(message: Message):
    """Показать список запланированных рыбалок в группе"""
    trips = database.get_trips()
    if not trips:
        await message.reply(
            "📅 Пока нет запланированных рыбалок.\n"
            "Вы можете создать новый выезд через WebApp или инлайн-режим!",
            reply_markup=keyboards.get_trips_keyboard()
        )
        return

    text = "📅 <b>Ближайшие запланированные выезды на рыбалку:</b>\n\n"
    for t in trips[:4]:
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
    text = "📍 <b>Популярные рыбные точки на Двине и Белом море:</b>\n\n"
    for s in spots[:4]:
        text += f"• <b>{s['name']}</b> ({s['area']})\n  Координаты: <code>{s['lat']}, {s['lon']}</code>\n"
    
    text += "\n<i>Все координаты сохранены в интерактивной карте:</i>"
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
        description=f"Передано из группы Telegram"
    )
    database.add_log(user, f"Отправил координаты: {lat}, {lon}", log_type="location")

    await message.reply(
        f"📍 <b>{user}</b>, точка сохранена в общую базу!\nКоординаты: <code>{lat:.5f}, {lon:.5f}</code>\n"
        f"<i>Координаты внесены в базу и отображаются на карте WebApp.</i>",
        parse_mode="HTML",
        reply_markup=keyboards.get_spots_keyboard()
    )

@router.message(F.chat.type.in_(["group", "supergroup"]), F.text)
async def handle_group_message(message: Message):
    """Реакция 👀 и логирование сообщений в общий журнал рыбаков"""
    # Пропускаем команды, чтобы они обрабатывались своими хэндлерами
    if message.text and message.text.startswith('/'):
        return

    user = message.from_user.first_name if message.from_user else "Рыбак"
    text = message.text

    # Ставим реакцию 👀
    try:
        await message.react([ReactionTypeEmoji(emoji="👀")])
    except Exception:
        pass

    # Запись в базу логов
    database.add_log(user, text, log_type="text")

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

@router.callback_query(F.data.in_(["vote_yes", "vote_no"]))
async def handle_vote_callback(call: CallbackQuery):
    user = call.from_user.first_name if call.from_user else "Рыбак"
    choice = "ИДЕТ В ЭКИПАЖ" if call.data == "vote_yes" else "НЕ ИДЕТ"

    database.add_log("ГОЛОСОВАНИЕ", f"{user} -> {choice}", log_type="vote")
    await call.answer("Голос учтен!")

    reply_text = (
        f"🔥 <b>{user}</b>, зафиксировано! Вы записаны в экипаж."
        if call.data == "vote_yes"
        else f"🫡 <b>{user}</b>, отказ зафиксирован."
    )
    if call.message:
        await call.message.reply(reply_text, parse_mode="HTML")

@router.callback_query(F.data == "btn_spots")
async def handle_spots_callback(call: CallbackQuery):
    await call.answer()
    if call.message:
        await call.message.reply(
            "🗺 Координаты точек и карта Поморья доступны в веб-приложении:",
            reply_markup=keyboards.get_spots_keyboard()
        )

@router.callback_query(F.data == "btn_trips")
async def handle_trips_callback(call: CallbackQuery):
    await call.answer()
    if call.message:
        await call.message.reply(
            "📅 Запланированные выезды и бронирование мест:",
            reply_markup=keyboards.get_trips_keyboard()
        )
