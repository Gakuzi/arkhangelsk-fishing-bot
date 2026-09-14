from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, ReactionTypeEmoji
import database
import keyboards

router = Router()

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
        f"📍 <b>{user}</b>, точка принята!\nКоординаты: <code>{lat:.5f}, {lon:.5f}</code>\n"
        f"<i>Координаты внесены в базу и отображаются на карте WebApp.</i>",
        parse_mode="HTML",
        reply_markup=keyboards.get_spots_keyboard()
    )

@router.message(F.chat.type.in_(["group", "supergroup"]), F.text)
async def handle_group_message(message: Message):
    """Реакция 👀 и логирование в журнал Spark"""
    user = message.from_user.first_name if message.from_user else "Рыбак"
    text = message.text

    # Ставим реакцию 👀
    try:
        await message.react([ReactionTypeEmoji(emoji="👀")])
    except Exception:
        pass

    # Запись в лог
    database.add_log(user, text, log_type="text")

    # Spark ответ
    await message.reply(
        "<i>✍️ Записано в журнал.\n⏱ Spark проверит переписку через ~30 мин.</i>",
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
