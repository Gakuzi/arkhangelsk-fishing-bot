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
        if (config.enablePolling) {
          this.startLongPolling();
        } else {
          console.log('[TelegramBot] Long polling disabled in Node server (handled by Python bot)');
        }
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
    if (update.inline_query) {
      await this.handleInlineQuery(update.inline_query);
    } else if (update.message) {
      await this.handleIncomingMessage(update.message);
    } else if (update.callback_query) {
      await this.handleIncomingCallback(update.callback_query);
    }
  }

  private async handleInlineQuery(iq: any) {
    const query = (iq.query || '').trim().toLowerCase();
    const userId = String(iq.from?.id || '');
    const firstName = iq.from?.first_name || 'Рыбак';
    const profile = storage.getUserById(userId);

    const transportName = profile?.transportName || 'Нива 4x4 / УАЗ Патриот';
    const fuelType = profile?.fuelType || 'АИ-92';
    const fuelPrice = profile?.fuelPricePerLiter || 56.5;
    const fuelConsumption = profile?.fuelConsumptionPer100km || 10.5;
    const totalSeats = profile?.totalSeats || 4;
    const availableSeats = profile?.availableSeats !== undefined ? profile.availableSeats : 3;
    const costPerKm = (fuelConsumption / 100) * fuelPrice;

    const results: any[] = [];

    // 0. Distance number query
    const numMatch = query.match(/^\d+$/);
    if (numMatch) {
      const km = Number(numMatch[0]);
      const totalFuel = km * costPerKm;
      const perPerson = totalFuel / Math.max(1, totalSeats);
      results.push({
        type: 'article',
        id: `calc_${km}`,
        title: `⛽️ Расчёт на ${km} км: ${Math.round(totalFuel)} ₽ (по ${Math.round(perPerson)} ₽/чел)`,
        description: `Авто: ${transportName} • ${costPerKm.toFixed(2)} ₽/км • ${fuelConsumption} л/100км`,
        input_message_content: {
          message_text:
            `⛽️ <b>Расчёт поездки на ${km} км (${transportName}):</b>\n\n` +
            `• Расстояние: <b>${km} км</b>\n` +
            `• Автомобиль: <b>${transportName}</b> (${fuelConsumption} л/100км, ${fuelType})\n` +
            `• Общая сумма на бензин: <b>${Math.round(totalFuel)} ₽</b>\n\n` +
            `<blockquote>👥 <b>Разбивка на экипаж:</b>\n` +
            `• Вдвоём: по <b>${Math.round(totalFuel / 2)} ₽</b> с человека\n` +
            `• Вчетвером: по <b>${Math.round(perPerson)} ₽</b> с человека</blockquote>`,
          parse_mode: 'HTML'
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Открыть в приложении', web_app: { url: `${config.appUrl}?tab=profile` } }],
            [{ text: '🚗 Карточка авто', switch_inline_query: 'car' }]
          ]
        }
      });
    }

    // 1. Car Card
    if (!query || query.includes('car') || query.includes('авто') || query.includes('машин') || query.includes('бенз')) {
      results.push({
        type: 'article',
        id: `car_${userId}`,
        title: `🚗 Мой автомобиль: ${transportName} (свободно ${availableSeats} мест)`,
        description: `Расход ${fuelConsumption} л/100км • ${fuelType} • ${costPerKm.toFixed(2)} ₽/км`,
        input_message_content: {
          message_text:
            `🚗 <b>Экипаж и транспорт: ${firstName}</b>\n\n` +
            `• <b>Техника:</b> ${transportName}\n` +
            `• <b>Топливо:</b> ${fuelType} (<code>${fuelPrice.toFixed(1)} ₽/л</code>, расход <code>${fuelConsumption.toFixed(1)} л/100км</code>)\n` +
            `• <b>Свободных мест:</b> <b>${availableSeats}</b> из ${totalSeats}\n` +
            `• <b>Себестоимость хода:</b> <code>${costPerKm.toFixed(2)} ₽/км</code>\n\n` +
            `<blockquote>⛽️ <b>Примерные затраты на бензин:</b>\n` +
            `• 100 км = <b>${Math.round(costPerKm * 100)} ₽</b> (~${Math.round((costPerKm * 100) / totalSeats)} ₽/чел)\n` +
            `• 150 км = <b>${Math.round(costPerKm * 150)} ₽</b> (~${Math.round((costPerKm * 150) / totalSeats)} ₽/чел)</blockquote>\n\n` +
            `<i>Готов взять попутчиков на рыбалку!</i>`,
          parse_mode: 'HTML'
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Открыть профиль в Mini App', web_app: { url: `${config.appUrl}?tab=profile` } }],
            [
              { text: '⛽️ Рассчитать км', switch_inline_query_current_chat: '120' },
              { text: '📅 Собрать выезд', switch_inline_query: 'trips' }
            ]
          ]
        }
      });
    }

    // 2. Trips
    const trips = storage.getTrips();
    for (const trip of trips.slice(0, 4)) {
      const freeSlots = Math.max(0, trip.maxCrew - (trip.participants?.length || 0));
      results.push({
        type: 'article',
        id: `trip_${trip.id}`,
        title: `📅 ${trip.title} (${trip.destination})`,
        description: `Свободно: ${freeSlots}/${trip.maxCrew} • ${trip.date} в ${trip.meetTime}`,
        input_message_content: {
          message_text:
            `🎣 <b>Рыболовный выезд: ${trip.title}</b>\n\n` +
            `📍 <b>Место:</b> ${trip.destination}\n` +
            `📅 <b>Дата и время:</b> ${trip.date} в ${trip.meetTime}\n` +
            `⛵️ <b>Свободных мест:</b> <b>${freeSlots} из ${trip.maxCrew}</b>\n` +
            `👤 <b>Организатор:</b> ${trip.organizerName}\n\n` +
            `<i>Записывайтесь в экипаж:</i>`,
          parse_mode: 'HTML'
        },
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔥 Записаться в экипаж', callback_data: `trip_join:${trip.id}` },
              { text: '🫡 Не смогу', callback_data: `trip_decline:${trip.id}` }
            ],
            [{ text: '📱 Открыть в WebApp', web_app: { url: `${config.appUrl}?tab=trips` } }]
          ]
        }
      });
    }

    // 3. Spots
    const spots = storage.getSpots().slice(0, 3);
    for (const spot of spots) {
      results.push({
        type: 'article',
        id: `spot_${spot.id}`,
        title: `📍 ${spot.name} (${spot.area})`,
        description: `Координаты: ${spot.lat.toFixed(4)}, ${spot.lon.toFixed(4)}`,
        input_message_content: {
          message_text:
            `📍 <b>Рыболовная точка: ${spot.name}</b>\n` +
            `🌊 <b>Акватория:</b> ${spot.area}\n` +
            `🧭 <b>Координаты:</b> <code>${spot.lat}, ${spot.lon}</code>\n\n` +
            `🗺 <a href="https://yandex.ru/maps/?rtext=~${spot.lat}%2C${spot.lon}&rtt=auto">Открыть маршрут в Яндекс.Картах</a>`,
          parse_mode: 'HTML'
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗺 Открыть на карте в приложении', web_app: { url: `${config.appUrl}?tab=spots` } }]
          ]
        }
      });
    }

    await this.callApi('answerInlineQuery', {
      inline_query_id: iq.id,
      results,
      cache_time: 2,
      is_personal: true
    });
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

    if (text.startsWith('/car') || text.startsWith('/auto')) {
      const userId = String(msg.from?.id || '');
      const profile = storage.getUserById(userId);
      const transportName = profile?.transportName || 'Нива 4x4 / УАЗ Патриот';
      const fuelType = profile?.fuelType || 'АИ-92';
      const fuelPrice = profile?.fuelPricePerLiter || 56.5;
      const fuelConsumption = profile?.fuelConsumptionPer100km || 10.5;
      const totalSeats = profile?.totalSeats || 4;
      const availableSeats = profile?.availableSeats !== undefined ? profile.availableSeats : 3;
      const costPerKm = (fuelConsumption / 100) * fuelPrice;

      const carText =
        `🚗 <b>Автомобиль и техника рыбака:</b>\n\n` +
        `• <b>Модель:</b> ${transportName}\n` +
        `• <b>Топливо:</b> ${fuelType} (<code>${fuelPrice.toFixed(1)} ₽/л</code>, расход <code>${fuelConsumption.toFixed(1)} л/100км</code>)\n` +
        `• <b>Свободных мест:</b> <b>${availableSeats}</b> из ${totalSeats}\n` +
        `• <b>Себестоимость:</b> <code>${costPerKm.toFixed(2)} ₽/км</code>\n\n` +
        `<blockquote>⛽️ <b>Расчёт поездки:</b>\n` +
        `• 100 км = <b>${Math.round(costPerKm * 100)} ₽</b> (~${Math.round((costPerKm * 100) / totalSeats)} ₽/чел)\n` +
        `• 150 км = <b>${Math.round(costPerKm * 150)} ₽</b> (~${Math.round((costPerKm * 150) / totalSeats)} ₽/чел)</blockquote>\n\n` +
        `<i>Настроить авто можно в личном кабинете Mini App:</i>`;

      await this.callApi('sendMessage', {
        chat_id: chatId,
        text: carText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚙️ Настроить в Mini App', web_app: { url: `${config.appUrl}?tab=profile` } }],
            [
              { text: '📤 Скинуть авто в чат', switch_inline_query: 'car' },
              { text: '📅 Собрать выезд', switch_inline_query: 'trips' }
            ],
            [{ text: '➕ Добавить бота в группу', url: `https://t.me/${config.botUsername}?startgroup=true` }]
          ]
        }
      });
      return;
    }

    if (text.startsWith('/fuel')) {
      const parts = text.split(' ');
      const km = parts[1] && !isNaN(Number(parts[1])) ? Number(parts[1]) : 100;
      const userId = String(msg.from?.id || '');
      const profile = storage.getUserById(userId);
      const transportName = profile?.transportName || 'Нива 4x4 / УАЗ';
      const fuelConsumption = profile?.fuelConsumptionPer100km || 10.5;
      const fuelPrice = profile?.fuelPricePerLiter || 56.5;
      const totalSeats = profile?.totalSeats || 4;
      const costPerKm = (fuelConsumption / 100) * fuelPrice;
      const totalFuel = km * costPerKm;

      const fuelText =
        `⛽️ <b>Расчёт топлива на ${km} км (${transportName}):</b>\n\n` +
        `• Общая стоимость бензина: <b>${Math.round(totalFuel)} ₽</b>\n\n` +
        `<blockquote>👥 <b>Разбивка на экипаж:</b>\n` +
        `• Вдвоём: по <b>${Math.round(totalFuel / 2)} ₽</b> с человека\n` +
        `• Втроём: по <b>${Math.round(totalFuel / 3)} ₽</b> с человека\n` +
        `• Вчетвером: по <b>${Math.round(totalFuel / Math.max(1, totalSeats))} ₽</b> с человека</blockquote>`;

      await this.callApi('sendMessage', {
        chat_id: chatId,
        text: fuelText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Открыть в Mini App', web_app: { url: `${config.appUrl}?tab=profile` } }],
            [{ text: '📤 Поделиться в группе', switch_inline_query: `${km}` }]
          ]
        }
      });
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
