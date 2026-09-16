from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    WebAppInfo
)
from config import WEBAPP_URL, BOT_USERNAME

def get_webapp_inline_keyboard() -> InlineKeyboardMarkup:
    """Инлайн-клавиатура с вызовом веб-приложения на мобильных устройствах и ПК"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🌊 Запустить Поморский Mini App",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                )
            ],
            [
                InlineKeyboardButton(text="🚗 Мой автомобиль и бензин", callback_data="btn_car"),
                InlineKeyboardButton(text="📅 Выезды экипажа", callback_data="btn_trips")
            ],
            [
                InlineKeyboardButton(text="🗺 Точки лова", callback_data="btn_spots"),
                InlineKeyboardButton(text="🐟 Журнал уловов", callback_data="btn_history")
            ],
            [
                InlineKeyboardButton(
                    text="📤 Поделиться в чате / канале",
                    switch_inline_query="car"
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
                    text="⚙️ Изменить параметры в Mini App",
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
            ],
            [
                InlineKeyboardButton(
                    text="➕ Добавить бота в группу",
                    url=f"https://t.me/{BOT_USERNAME}?startgroup=true"
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
                    text="📱 Открыть в приложении",
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
                    text="🗺 Открыть карту точек в WebApp",
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
                    text="🚀 Открыть выезды в WebApp",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                )
            ],
            [
                InlineKeyboardButton(
                    text="📤 Отправить список выездов в группу",
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
                    text="👤 Открыть Личный Кабинет в WebApp",
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
                    text="🐟 Отчеты об уловах и снастях",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=history")
                )
            ]
        ]
    )

def get_main_reply_keyboard() -> ReplyKeyboardMarkup:
    """Главная клавиатура снизу чата для быстрого доступа к WebApp"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="🌊 Приложение Рыбака (WebApp)",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
                )
            ],
            [
                KeyboardButton(text="🚗 Мой автомобиль"),
                KeyboardButton(text="📅 Запланированные выезды")
            ],
            [
                KeyboardButton(text="📍 Отправить геопозицию", request_location=True),
                KeyboardButton(text="🗺 Точки лова")
            ]
        ],
        resize_keyboard=True
    )
