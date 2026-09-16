from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    WebAppInfo
)
from config import WEBAPP_URL, BOT_USERNAME

def get_main_reply_keyboard() -> ReplyKeyboardMarkup:
    """Постоянная главная клавиатура снизу чата для быстрого доступа ко всем разделам"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="🌊 Запустить Поморский Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                )
            ],
            [
                KeyboardButton(text="🚗 Экипажи и Поездки"),
                KeyboardButton(text="🗺 Карта и Точки лова")
            ],
            [
                KeyboardButton(text="⛽️ Калькулятор бензина"),
                KeyboardButton(text="🐟 Журнал уловов")
            ],
            [
                KeyboardButton(text="📍 Отправить геопозицию", request_location=True),
                KeyboardButton(text="👤 Мой профиль (@EKlimov84)")
            ]
        ],
        resize_keyboard=True,
        is_persistent=True,
        input_field_placeholder="Выберите действие в меню или введите километраж (/fuel 120)..."
    )

def get_webapp_inline_keyboard() -> InlineKeyboardMarkup:
    """Инлайн-клавиатура стартового экрана с современным оформлением"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🌊 Открыть Поморский Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                )
            ],
            [
                InlineKeyboardButton(text="🚗 Поездки и Экипажи", callback_data="btn_trips"),
                InlineKeyboardButton(text="🗺 Карта глубин и точек", callback_data="btn_spots")
            ],
            [
                InlineKeyboardButton(text="⛽️ Бензин и Авто", callback_data="btn_car"),
                InlineKeyboardButton(text="🐟 Отчёты об уловах", callback_data="btn_history")
            ],
            [
                InlineKeyboardButton(
                    text="📤 Поделиться в группе / ЛС",
                    switch_inline_query="trips"
                ),
                InlineKeyboardButton(
                    text="➕ Добавить в группу",
                    url=f"https://t.me/{BOT_USERNAME}?startgroup=true"
                )
            ]
        ]
    )

def get_car_inline_keyboard(fuel_per_km: float = 0.0) -> InlineKeyboardMarkup:
    """Клавиатура для карточки автомобиля с калькулятором топлива и инлайн-шерингом"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="⚙️ Изменить авто в Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                )
            ],
            [
                InlineKeyboardButton(text="⛽️ 50 км", callback_data="calc_km:50"),
                InlineKeyboardButton(text="⛽️ 100 км", callback_data="calc_km:100"),
                InlineKeyboardButton(text="⛽️ 150 км", callback_data="calc_km:150"),
                InlineKeyboardButton(text="⛽️ 200 км", callback_data="calc_km:200")
            ],
            [
                InlineKeyboardButton(
                    text="📤 Скинуть карточку авто в чат",
                    switch_inline_query="car"
                ),
                InlineKeyboardButton(
                    text="📅 Собрать выезд",
                    switch_inline_query="trips"
                )
            ]
        ]
    )

def get_trip_action_keyboard(trip_id: str) -> InlineKeyboardMarkup:
    """Клавиатура для поездки: запись, отказ, инлайн-шеринг и WebApp"""
    return InlineKeyboardMarkup(
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
                    text="📤 Кинуть этот выезд в группу",
                    switch_inline_query=f"trip {trip_id}"
                ),
                InlineKeyboardButton(
                    text="📱 Открыть в Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                )
            ]
        ]
    )

def get_spots_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🗺 Открыть спутниковую карту в Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=spots")
                )
            ],
            [
                InlineKeyboardButton(
                    text="📤 Поделиться точками в чате",
                    switch_inline_query="spots"
                )
            ]
        ]
    )

def get_trips_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Открыть выезды в Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                )
            ],
            [
                InlineKeyboardButton(
                    text="➕ Запланировать новый выезд",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                ),
                InlineKeyboardButton(
                    text="📤 Отправить в группу",
                    switch_inline_query="trips"
                )
            ]
        ]
    )

def get_profile_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="👤 Открыть Личный Кабинет в Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                )
            ],
            [
                InlineKeyboardButton(
                    text="🚗 Настройки авто и калькулятор",
                    callback_data="btn_car"
                )
            ]
        ]
    )

def get_history_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🐟 Отчёты об уловах и снастях в Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=history")
                )
            ]
        ]
    )
