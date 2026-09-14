import React, { useState } from 'react';
import { Send, MapPin, CheckSquare, MessageSquare, Flame, Check, X, Compass } from 'lucide-react';
import { ChatMessage } from '../types.ts';

interface TelegramSimulatorProps {
  onRefreshData: () => void;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({ onRefreshData }) => {
  const [userName, setUserName] = useState('Алексей_29');
  const [isGroup, setIsGroup] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'system',
      author: 'Система',
      text: 'Добро пожаловать в Telegram-симулятор бота "Архангельск Рыбалка"!',
      time: '08:00'
    },
    {
      id: 'm-2',
      sender: 'user',
      author: 'Михаил',
      text: 'Вчера на Мудьюге лед был крепкий, навага брала на блесну.',
      time: '08:15',
      reactions: ['👀']
    },
    {
      id: 'm-3',
      sender: 'bot',
      author: 'Arkhangelsk Fishing Bot',
      text: '<i>✍️ Записано в журнал.\n⏱ Spark проверит переписку через ~30 мин.</i>',
      time: '08:15'
    }
  ]);

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const getTimeStr = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSendText = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      author: userName,
      text: textToSend,
      time: getTimeStr(),
      reactions: []
    };

    addMessage(userMsg);
    if (!customText) setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: 'text',
          text: textToSend,
          user: userName,
          isGroup
        })
      });
      const data = await res.json();

      // Bot puts reaction 👀
      if (data.reaction) {
        setMessages(prev =>
          prev.map(m => (m.id === userMsg.id ? { ...m, reactions: [data.reaction] } : m))
        );
      }

      // Bot reply
      if (data.reply) {
        addMessage({
          id: `bot-${Date.now()}`,
          sender: 'bot',
          author: 'Arkhangelsk Fishing Bot',
          text: data.reply,
          time: getTimeStr()
        });
      }
      onRefreshData();
    } catch (err) {
      console.error('Error sending text:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendLocation = async (lat: number, lon: number, placeName: string) => {
    if (isSending) return;
    setIsSending(true);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      author: userName,
      text: `📍 Отправил геопозицию: ${placeName}`,
      location: { lat, lon },
      time: getTimeStr()
    };

    addMessage(userMsg);

    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: 'location',
          location: { lat, lon, name: placeName },
          user: userName,
          isGroup
        })
      });
      const data = await res.json();

      if (data.reply) {
        addMessage({
          id: `bot-${Date.now()}`,
          sender: 'bot',
          author: 'Arkhangelsk Fishing Bot',
          text: data.reply,
          time: getTimeStr()
        });
      }
      onRefreshData();
    } catch (err) {
      console.error('Error sending location:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleTriggerCallback = async (action: string, buttonLabel: string) => {
    if (isSending) return;
    setIsSending(true);

    addMessage({
      id: `act-${Date.now()}`,
      sender: 'user',
      author: userName,
      text: `[Нажата кнопка]: ${buttonLabel}`,
      time: getTimeStr()
    });

    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: 'callback',
          action,
          user: userName,
          isGroup
        })
      });
      const data = await res.json();

      if (data.reply) {
        addMessage({
          id: `bot-${Date.now()}`,
          sender: 'bot',
          author: 'Arkhangelsk Fishing Bot',
          text: data.reply,
          time: getTimeStr(),
          buttons: data.buttons
        });
      }
      onRefreshData();
    } catch (err) {
      console.error('Error handling callback:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Simulator Top Controls */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
            ✈
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{isGroup ? 'Группа: Рыбалка Архангельск' : 'Диалог с @ArkhangelskFishingBot'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                TG Симулятор
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {isGroup ? 'Сообщения логируются в журнал Spark' : 'Личный приватный чат'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Имя:</span>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="bg-transparent text-slate-100 font-medium focus:outline-none w-24 text-xs"
              placeholder="Имя рыбака"
            />
          </div>

          <button
            onClick={() => setIsGroup(!isGroup)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium border border-slate-700 transition"
          >
            {isGroup ? 'Режим: Группа 👥' : 'Режим: ЛС 👤'}
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[340px] max-h-[460px] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'system'
                ? 'items-center text-center'
                : msg.sender === 'user'
                ? 'items-end'
                : 'items-start'
            }`}
          >
            {msg.sender === 'system' ? (
              <div className="px-3 py-1 rounded-full bg-slate-800/80 text-[11px] text-slate-400 border border-slate-700/50">
                {msg.text}
              </div>
            ) : (
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-md relative ${
                  msg.sender === 'user'
                    ? 'bg-sky-700 text-sky-50 rounded-br-none'
                    : 'bg-slate-800/95 text-slate-200 border border-slate-700/60 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[11px] font-medium opacity-75 mb-1">
                  <span>{msg.author}</span>
                  <span className="text-[10px]">{msg.time}</span>
                </div>

                <div
                  className="space-y-1 whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />

                {msg.location && (
                  <div className="mt-2 p-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-xs flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Координаты: {msg.location.lat.toFixed(4)}, {msg.location.lon.toFixed(4)}
                    </span>
                  </div>
                )}

                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="absolute -bottom-2.5 right-2 px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-xs shadow-md">
                    {msg.reactions.join(' ')}
                  </div>
                )}

                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                    {msg.buttons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (btn.callback_data) {
                            handleTriggerCallback(btn.callback_data, btn.text);
                          } else {
                            setIsGroup(false);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/60 text-xs font-medium transition"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Action Bar from Bot Callbacks */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800">
        <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Быстрые действия бота из Python-кода:</span>
          <span className="text-slate-500">Эмуляция инлайн-кнопок</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => handleTriggerCallback('btn_spots', '📍 Точки лова')}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>btn_spots</span>
          </button>

          <button
            onClick={() => handleTriggerCallback('vote_yes', '🔥 Иду в экипаж')}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 text-xs font-medium transition"
          >
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <span>vote_yes</span>
          </button>

          <button
            onClick={() => handleTriggerCallback('vote_no', '🫡 Не иду')}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-medium transition"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>vote_no</span>
          </button>

          <button
            onClick={() => handleSendLocation(64.8564, 40.2812, 'Остров Мудьюг (Сухое Море)')}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/40 text-xs font-medium transition"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>Скинуть точку</span>
          </button>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendText();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Напишите сообщение в чат рыбаков..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium shadow-md shadow-sky-950 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
