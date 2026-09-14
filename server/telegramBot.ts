import { config } from './config.ts';
import { storage } from './storage.ts';

export class TelegramBotService {
  private isPolling = false;
  private offset = 0;
  private pollAbortController: AbortController | null = null;
  private botInfo: { id?: number; first_name?: string; username?: string } | null = null;

  constructor() {
    this.initBot();
  }

  private async initBot() {
    if (!config.telegramToken) return;

    try {
      const me = await this.callApi('getMe');
      if (me && me.ok) {
        this.botInfo = me.result;
        console.log(`[TelegramBot] Connected as @${this.botInfo?.username} (${this.botInfo?.first_name})`);
        this.startLongPolling();
      } else {
        console.warn('[TelegramBot] Failed to verify token with Telegram getMe:', me?.description);
      }
    } catch (err: any) {
      console.warn('[TelegramBot] Offline or token check error:', err?.message || err);
    }
  }

  public getStatus() {
    return {
      hasToken: Boolean(config.telegramToken),
      tokenMasked: config.telegramToken
        ? `${config.telegramToken.slice(0, 5)}...${config.telegramToken.slice(-4)}`
        : 'Not configured',
      chatId: config.telegramChatId,
      botUsername: this.botInfo?.username || config.botUsername,
      isPolling: this.isPolling,
      appUrl: config.appUrl
    };
  }

  public async callApi(method: string, payload: Record<string, any> = {}) {
    if (!config.telegramToken) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${config.telegramToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error(`[TelegramBot] Error calling ${method}:`, err);
      return null;
    }
  }

  public startLongPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.pollAbortController = new AbortController();
    this.pollingLoop();
  }

  public stopLongPolling() {
    this.isPolling = false;
    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = null;
    }
  }

  private async pollingLoop() {
    while (this.isPolling) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${config.telegramToken}/getUpdates?offset=${this.offset}&timeout=15`,
          { signal: this.pollAbortController?.signal }
        );
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            await this.handleUpdate(update);
          }
        } else {
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') break;
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  public async handleUpdate(update: any) {
    if (update.message) {
      await this.handleIncomingMessage(update.message);
    } else if (update.callback_query) {
      await this.handleIncomingCallback(update.callback_query);
    }
  }

  private async handleIncomingMessage(msg: any) {
    const chatId = msg.chat?.id;
    const user = msg.from?.first_name || 'Рыбак';
    const username = msg.from?.username || '';
    const text = msg.text?.trim() || '';

    // Handle Geolocation
    if (msg.location) {
      const { latitude: lat, longitude: lon } = msg.location;
      storage.addSpot({
        name: `Точка от ${user}`,
        lat,
        lon,
        area: 'Северная Двина / Приморский р-н',
        recommendedFish: ['Навага', 'Окунь', 'Корюшка'],
        season: 'Круглый год',
        description: `Отправлено через Telegram пользователем @${username || user}`,
        addedBy: user
      });

      await this.callApi('sendMessage', {
        chat_id: chatId,
        text: `📍 <b>${user}</b>, точка принята!\nКоординаты: <code>${lat}, ${lon}</code>\n<i>Координаты внесены в базу приложения и журнала Spark.</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎣 Открыть карту в приложении',
                web_app: { url: config.appUrl }
              }
            ]
          ]
        }
      });
      return;
    }

    // Commands
    if (text.startsWith('/start')) {
      const welcomeText =
        `👋 Привет, <b>${user}</b>!\n\n` +
        `Добро пожаловать в рыболовный бот Архангельской области (Северная Двина, Белое Море, Сухое Море).\n\n` +
        `Здесь ты можешь:\n` +
        `• 📱 Открыть личный кабинет и приложение рыбака\n` +
        `• 📅 Участвовать в запланированных выездах и собирать экипажи\n` +
        `• 📍 Смотреть и сохранять координаты клевых мест\n` +
        `• 🐟 Вести журнал рыбалок, снастей и трофейных уловов`;

      await this.callApi('sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎣 Открыть Веб-приложение Рыбака',
                web_app: { url: config.appUrl }
              }
            ],
            [
              { text: '🗺 Точки лова', callback_data: 'btn_spots' },
              { text: '📅 Выезды экипажа', callback_data: 'btn_trips' }
            ],
            [
              { text: '🔥 Я в экипаже', callback_data: 'vote_yes' },
              { text: '🫡 Не иду', callback_data: 'vote_no' }
            ]
          ]
        }
      });
      storage.addLog(user, '/start в боте', 'system');
      return;
    }

    if (text.startsWith('/webapp')) {
      await this.callApi('sendMessage', {
        chat_id: chatId,
        text: 'Нажмите кнопку ниже, чтобы открыть веб-кабинет:',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌊 Запустить Веб-приложение', web_app: { url: config.appUrl } }]
          ]
        }
      });
      return;
    }

    if (text.startsWith('/spots')) {
      const spots = storage.getSpots().slice(0, 4);
      let msgText = '📍 <b>Популярные рыбные точки Поморья:</b>\n\n';
      spots.forEach((s, idx) => {
        msgText += `${idx + 1}. <b>${s.name}</b> (${s.area})\nРыба: ${s.recommendedFish.join(', ')}\nКоординаты: <code>${s.lat}, ${s.lon}</code>\n\n`;
      });

      await this.callApi('sendMessage', {
        chat_id: chatId,
        text: msgText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗺 Открыть все точки на карте', web_app: { url: config.appUrl } }]
          ]
        }
      });
      return;
    }

    // Standard message: Set reaction 👀 and log to doc
    if (text) {
      try {
        await this.callApi('setMessageReaction', {
          chat_id: chatId,
          message_id: msg.message_id,
          reaction: [{ type: 'emoji', emoji: '👀' }]
        });
      } catch {}

      storage.addLog(user, text, 'text');
      await this.callApi('sendMessage', {
        chat_id: chatId,
        text: '<i>✍️ Записано в журнал.\n⏱ Spark проверит переписку через ~30 мин.</i>',
        parse_mode: 'HTML'
      });
    }
  }

  private async handleIncomingCallback(call: any) {
    const user = call.from?.first_name || 'Рыбак';
    const action = call.data;
    const chatId = call.message?.chat?.id;

    await this.callApi('answerCallbackQuery', { callback_query_id: call.id });

    if (action === 'btn_spots') {
      storage.addLog('СИСТЕМА', `${user} запросил меню отправки точки.`, 'system');
      await this.callApi('sendMessage', {
        chat_id: chatId,
        text:
          `🗺 <b>${user}</b>, координаты можно передать прямо из геолокации Telegram или в веб-приложении.\n\n` +
          `👉 Нажмите кнопку ниже для перехода:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📍 Открыть карту точек', web_app: { url: config.appUrl } }]
          ]
        }
      });
    } else if (action === 'btn_trips') {
      const trips = storage.getTrips();
      let text = '📅 <b>Запланированные выезды экипажа:</b>\n\n';
      trips.forEach(t => {
        text += `• <b>${t.title}</b>\n  Дата: ${t.date} в ${t.meetTime}\n  Место: ${t.destination}\n  Экипаж: ${t.participants.length}/${t.maxCrew} чел.\n\n`;
      });
      await this.callApi('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Записаться в экипаж', web_app: { url: config.appUrl } }]
          ]
        }
      });
    } else if (action === 'vote_yes' || action === 'vote_no') {
      const voteText = action === 'vote_yes' ? 'ИДЕТ' : 'НЕ ИДЕТ';
      storage.addLog('ГОЛОСОВАНИЕ', `${user} -> ${voteText}`, 'vote');
      const reply = action === 'vote_yes'
        ? `🔥 <b>${user}</b>, зафиксировано! Вы в экипаже.`
        : `🫡 <b>${user}</b>, отказ зафиксирован.`;

      await this.callApi('sendMessage', {
        chat_id: chatId,
        text: reply,
        parse_mode: 'HTML'
      });
    }
  }

  // Simulation handler for the web UI
  public async simulateMessage(payload: {
    messageType: 'text' | 'location' | 'callback';
    text?: string;
    location?: { lat: number; lon: number; name?: string };
    user: string;
    action?: string;
    isGroup?: boolean;
  }) {
    const author = payload.user || 'Рыбак_Архангельск';

    if (payload.messageType === 'callback') {
      if (payload.action === 'btn_spots') {
        storage.addLog('СИСТЕМА', `${author} запросил меню отправки точки.`, 'system');
        return {
          reply: `🗺 <b>${author}</b>, просмотр и отправка координат работает в веб-приложении или через кнопку геолокации.`,
          parse_mode: 'HTML',
          buttons: [
            { text: '🎣 Открыть карту точек', url: config.appUrl },
            { text: '📍 Отправить геопозицию', callback_data: 'send_geo' }
          ]
        };
      }

      if (payload.action === 'btn_trips') {
        const trips = storage.getTrips();
        let text = `📅 <b>Запланированные выезды (${trips.length}):</b>\n\n`;
        trips.forEach(t => {
          text += `• <b>${t.title}</b> (${t.destination})\n  Экипаж: ${t.participants.length}/${t.maxCrew} чел.\n`;
        });
        return { reply: text, parse_mode: 'HTML' };
      }

      if (payload.action === 'vote_yes' || payload.action === 'vote_no') {
        const vote = payload.action === 'vote_yes' ? 'ИДЕТ' : 'НЕ ИДЕТ';
        storage.addLog('ГОЛОСОВАНИЕ', `${author} -> ${vote}`, 'vote');
        return {
          reply: payload.action === 'vote_yes'
            ? `🔥 <b>${author}</b>, зафиксировано! Вы в экипаже.`
            : `🫡 <b>${author}</b>, отказ зафиксирован.`,
          parse_mode: 'HTML'
        };
      }
    }

    if (payload.messageType === 'location' && payload.location) {
      const { lat, lon, name } = payload.location;
      storage.addSpot({
        name: name || `Точка от ${author} (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        lat,
        lon,
        area: 'Архангельск и окрестности',
        recommendedFish: ['Навага', 'Окунь', 'Корюшка'],
        season: 'Круглый год',
        description: 'Отправлено через Telegram координатор',
        addedBy: author
      });

      return {
        reply: `📍 <b>${author}</b>, точка принята!\nКоординаты: <code>${lat}, ${lon}</code>\n<i>Spark учтет этот квадрат и добавит в карту выездов.</i>`,
        parse_mode: 'HTML'
      };
    }

    if (payload.text) {
      storage.addLog(author, payload.text, 'text');
      return {
        reaction: '👀',
        reply: `<i>✍️ Записано в журнал.\n⏱ Spark проверит переписку через ~30 мин.</i>`,
        parse_mode: 'HTML'
      };
    }

    return { error: 'Unknown payload' };
  }
}

export const telegramBot = new TelegramBotService();
