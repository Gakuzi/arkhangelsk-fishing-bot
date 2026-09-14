from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    WebAppInfo
)
from config import WEBAPP_URL

def get_webapp_inline_keyboard() -> InlineKeyboardMarkup:
    """Инлайн-клавиатура с вызовом веб-приложения на мобильных устройствах и ПК"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🎣 Открыть Веб-приложение Рыбака",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ],
            [
                InlineKeyboardButton(text="🗺 Точки лова", callback_data="btn_spots"),
                InlineKeyboardButton(text="📅 Выезды экипажа", callback_data="btn_trips")
            ],
            [
                InlineKeyboardButton(text="🔥 Я в экипаже", callback_data="vote_yes"),
                InlineKeyboardButton(text="🫡 Не иду", callback_data="vote_no")
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
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ],
            [
                KeyboardButton(text="📍 Отправить геопозицию", request_location=True),
                KeyboardButton(text="📅 Запланированные выезды")
            ]
        ],
        resize_keyboard=True
    )

def get_spots_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🗺 Открыть карту точек в WebApp",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=spots")
                )
            ]
        ]
    )

def get_trips_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Записаться в экипаж (WebApp)",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=trips")
                )
            ],
            [
                InlineKeyboardButton(text="🔥 Я в экипаже", callback_data="vote_yes"),
                InlineKeyboardButton(text="🫡 Не иду", callback_data="vote_no")
            ]
        ]
    )

def get_profile_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="👤 Открыть Личный Кабинет",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?tab=profile")
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
