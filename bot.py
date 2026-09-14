import telebot
import time
import json
import threading
import requests
from datetime import datetime
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

TELEGRAM_TOKEN = '8666462902:AAFhIMmwQtk0KmN_iM60PAEfsWBCvS0OYhw'
TELEGRAM_CHAT_ID = '-1004386693265'

LOG_DOC_ID = '1hs2ZbXq-6Ijc4z4g0KyilkMnwZ63b6l0e3D6tobACFU'
QUEUE_DOC_ID = '1j_2ta_pQPH2kuETaRPBJkU6QCRkVzQNgxV7Ql6PBUdA'
CREDENTIALS_FILE = 'credentials.json'

bot = telebot.TeleBot(TELEGRAM_TOKEN)

scopes = ['https://www.googleapis.com/auth/documents']
creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scopes)
docs_service = build('docs', 'v1', credentials=creds)

def log_to_doc(role, text):
    try:
        time_str = datetime.now().strftime("%d.%m %H:%M")
        content = f"[{time_str}] {role}: {text}\n"
        requests_body = [{'insertText': {'endOfSegmentLocation': {'segmentId': ''}, 'text': content}}]
        docs_service.documents().batchUpdate(documentId=LOG_DOC_ID, body={'requests': requests_body}).execute()
    except Exception as e:
        print(f"Ошибка записи в лог: {e}")

@bot.message_handler(content_types=['text', 'location'])
def handle_messages(msg):
    chat_id = msg.chat.id
    user = msg.from_user.first_name

    if msg.location:
        lat, lon = msg.location.latitude, msg.location.longitude
        bot.send_message(chat_id, f"📍 <b>{user}</b>, точка принята!\nКоординаты: <code>{lat}, {lon}</code>\n<i>Spark учтет этот квадрат.</i>", parse_mode="HTML", reply_markup=telebot.types.ReplyKeyboardRemove())
        log_to_doc(user, f"📍 Прислал точку на карте: {lat}, {lon}")
        return

    if msg.text:
        text = msg.text.strip()
        try:
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/setMessageReaction", json={
                "chat_id": chat_id,
                "message_id": msg.message_id,
                "reaction": [{"type": "emoji", "emoji": "👀"}]
            })
        except Exception as e:
            print("Ошибка установки реакции:", e)

        log_to_doc(user, text)
        bot.reply_to(msg, "<i>✍️ Записано в журнал.\n⏱ Spark проверит переписку через ~30 мин.</i>", parse_mode="HTML")

@bot.callback_query_handler(func=lambda call: True)
def handle_callbacks(call):
    user = call.from_user.first_name
    action = call.data
    chat_id = call.message.chat.id

    bot.answer_callback_query(call.id)

    if action == "btn_spots":
        if call.message.chat.type in ['group', 'supergroup']:
            bot.send_message(
                chat_id, 
                f"🗺 <b>{user}</b>, отправка точных координат работает в личных сообщениях боту, чтобы другие участники не видели лишнего.\n\n"
                f"👉 Перейдите в диалог с ботом и нажмите кнопку ниже:", 
                parse_mode="HTML",
                reply_markup=telebot.types.InlineKeyboardMarkup().add(
                    telebot.types.InlineKeyboardButton("📍 Отправить точку в ЛС", url=f"https://t.me/{bot.get_me().username}")
                )
            )
        else:
            markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
            markup.add(telebot.types.KeyboardButton("📍 Отправить геопозицию", request_location=True))
            bot.send_message(chat_id, f"🗺 Нажмите кнопку ниже, чтобы отправить координаты:", reply_markup=markup)
            
        log_to_doc("СИСТЕМА", f"{user} запросил меню отправки точки.")
    
    elif action in ["vote_yes", "vote_no"]:
        vote_text = "ИДЕТ" if action == "vote_yes" else "НЕ ИДЕТ"
        log_to_doc("ГОЛОСОВАНИЕ", f"{user} -> {vote_text}")
        
        if action == "vote_yes":
            bot.send_message(chat_id, f"🔥 <b>{user}</b>, зафиксировано! Вы в экипаже.", parse_mode="HTML")
        else:
            bot.send_message(chat_id, f"🫡 <b>{user}</b>, отказ зафиксирован.", parse_mode="HTML")

def process_spark_queue():
    while True:
        try:
            doc = docs_service.documents().get(documentId=QUEUE_DOC_ID).execute()
            content = ""
            for element in doc.get('body').get('content'):
                if 'paragraph' in element:
                    for p_elem in element.get('paragraph').get('elements'):
                        if 'textRun' in p_elem:
                            content += p_elem.get('textRun').get('content')
            
            content = content.strip()
            if content.startswith("[") and content.endswith("]"):
                commands = json.loads(content)
                for cmd in commands:
                    method = cmd.get("method")
                    payload = cmd.get("payload")
                    if not payload.get("chat_id"):
                        payload["chat_id"] = TELEGRAM_CHAT_ID
                    requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/{method}", json=payload)
                
                end_index = doc['body']['content'][-1]['endIndex']
                if end_index > 2:
                    docs_service.documents().batchUpdate(
                        documentId=QUEUE_DOC_ID, 
                        body={'requests': [{'deleteContentRange': {'range': {'startIndex': 1, 'endIndex': end_index - 1}}}]}
                    ).execute()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Команды от Spark доставлены!")
        except Exception as e:
            pass
        time.sleep(5)

if __name__ == '__main__':
    print("🚀 Бот запускается на сервере...")
    requests.get(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/deleteWebhook?drop_pending_updates=true")
    threading.Thread(target=process_spark_queue, daemon=True).start()
    print("✅ Бот успешно подключен к Telegram. Жду сообщений...")
    bot.infinity_polling(timeout=10, long_polling_timeout=5)
