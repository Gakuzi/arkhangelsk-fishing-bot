import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Smartphone,
  MapPin,
  RefreshCw,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  MessageSquare,
  Compass,
  Check
} from 'lucide-react';
import { BotStatus, LogEntry, ChatMessage, UserProfile } from '../../types/index.ts';

interface TelegramBotConsoleProps {
  botStatus: BotStatus | null;
  logs: LogEntry[];
  activeUser: UserProfile | null;
  onSimulateMessage: (payload: any) => Promise<any>;
  onSendRealMessage: (text: string) => Promise<any>;
  onRefreshData: () => Promise<void>;
}

export const TelegramBotConsole: React.FC<TelegramBotConsoleProps> = ({
  botStatus,
  logs,
  activeUser,
  onSimulateMessage,
  onSendRealMessage,
  onRefreshData
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'bot',
      author: 'Поморский Бот Рыбака',
      text: '👋 Приветствую в координаторе рыбалки Архангельской области!\n\nИспользуйте команды:\n/start — Главное меню и запуск Веб-приложения\n/spots — Точки лова\n/webapp — Кнопка WebApp\nИли просто пришлите геолокацию 📍 лунки со льда.',
      time: '10:00',
      buttons: [
        { text: '🎣 Открыть Веб-приложение', url: window.location.origin },
        { text: '🗺 Точки лова', callback_data: 'btn_spots' },
        { text: '📅 Выезды экипажа', callback_data: 'btn_trips' }
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [realMessageText, setRealMessageText] = useState('');
  const [realSendStatus, setRealSendStatus] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !activeUser) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      author: activeUser.name,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addMessage(userMsg);
    if (!customText) setInputText('');

    setSimulating(true);
    try {
      const res = await onSimulateMessage({
        messageType: 'text',
        text: textToSend,
        user: activeUser.name,
        isGroup: isGroupChat
      });

      // If text reaction
      if (res.reaction) {
        setMessages(prev =>
          prev.map(m => (m.id === userMsg.id ? { ...m, reactions: [res.reaction] } : m))
        );
      }

      if (res.reply) {
        addMessage({
          id: `b-${Date.now()}`,
          sender: 'bot',
          author: 'Поморский Бот',
          text: res.reply.replace(/<[^>]*>?/gm, ''), // strip simple HTML for display
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          buttons: res.buttons
        });
      }
      await onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSendLocation = async () => {
    if (!activeUser) return;
    const lat = 64.8820;
    const lon = 40.2910;

    const locMsg: ChatMessage = {
      id: `loc-${Date.now()}`,
      sender: 'user',
      author: activeUser.name,
      text: `📍 Отправлена геопозиция: ${lat}, ${lon} (Мудьюг)`,
      location: { lat, lon },
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addMessage(locMsg);

    setSimulating(true);
    try {
      const res = await onSimulateMessage({
        messageType: 'location',
        location: { lat, lon, name: `Точка от ${activeUser.name} (${lat}, ${lon})` },
        user: activeUser.name,
        isGroup: isGroupChat
      });

      if (res.reply) {
        addMessage({
          id: `b-${Date.now()}`,
          sender: 'bot',
          author: 'Поморский Бот',
          text: res.reply.replace(/<[^>]*>?/gm, ''),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      await onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleCallbackClick = async (action: string, btnText: string) => {
    if (!activeUser) return;
    addMessage({
      id: `cb-${Date.now()}`,
      sender: 'user',
      author: activeUser.name,
      text: `[Нажал кнопку: ${btnText}]`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setSimulating(true);
    try {
      const res = await onSimulateMessage({
        messageType: 'callback',
        action,
        user: activeUser.name,
        isGroup: isGroupChat
      });

      if (res.reply) {
        addMessage({
          id: `b-${Date.now()}`,
          sender: 'bot',
          author: 'Поморский Бот',
          text: res.reply.replace(/<[^>]*>?/gm, ''),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          buttons: res.buttons
        });
      }
      await onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSendReal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realMessageText.trim()) return;
    setRealSendStatus('Отправка в реальный Telegram...');
    try {
      const res = await onSendRealMessage(realMessageText);
      if (res?.ok) {
        setRealSendStatus('✅ Сообщение доставлено в чат Telegram!');
        setRealMessageText('');
      } else {
        setRealSendStatus(`⚠️ Ошибка API: ${res?.description || 'Проверьте токен бота в .env'}`);
      }
    } catch (err: any) {
      setRealSendStatus(`Ошибка: ${err?.message || err}`);
    }
    setTimeout(() => setRealSendStatus(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Bot Status & Integration Strip */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Интеграция с Telegram Ботом</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    botStatus?.hasToken
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                  }`}
                >
                  {botStatus?.hasToken ? 'Telegram API подключен' : 'Готов к работе (Симулятор + WebApp)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Архитектура поддерживает запуск в Telegram Mini App, обработку геолокаций и команд в группе.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefreshData()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Обновить журнал"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <a
              href={`https://t.me/${botStatus?.botUsername || 'ArkhangelskFishingBot'}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-md shadow-sky-950"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Открыть @{botStatus?.botUsername || 'ArkhangelskFishingBot'}</span>
            </a>
          </div>
        </div>

        {/* Integration Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 mb-0.5">Telegram WebApp URL:</div>
            <div className="font-mono text-slate-300 truncate" title={window.location.origin}>
              {window.location.origin}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 mb-0.5">Режим работы:</div>
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full-Stack WebApp + Long-Polling</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 mb-0.5">Бот Юзернейм:</div>
            <div className="font-mono text-sky-400">@{botStatus?.botUsername || 'ArkhangelskFishingBot'}</div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Live Simulator & Synced Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Chat Simulator */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-[640px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white text-xs font-bold">
                ТГ
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Рыбалка Поморья (Группа)</span>
                  <span className="text-[10px] text-emerald-400 px-1.5 py-0.2 bg-emerald-950/60 rounded border border-emerald-800/40">
                    online
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Вы пишете от имени: <strong className="text-sky-400">{activeUser?.name}</strong>
                </div>
              </div>
            </div>

            {/* Quick Command chips */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSendMessage('/start')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
              >
                /start
              </button>
              <button
                onClick={() => handleSendMessage('/spots')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
              >
                /spots
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 text-xs"
          >
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-500 mb-1 px-1">{msg.author}</div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm space-y-2 relative ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                    {/* Telegram Reactions Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="absolute -bottom-2 -left-2 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded-full text-xs shadow">
                        {msg.reactions.join(' ')}
                      </div>
                    )}

                    {/* Inline Buttons */}
                    {msg.buttons && (
                      <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-800/80">
                        {msg.buttons.map((b, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (b.url) {
                                window.open(b.url, '_blank');
                              } else if (b.callback_data) {
                                handleCallbackClick(b.callback_data, b.text);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 text-[11px] font-medium transition"
                          >
                            {b.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-600 mt-1 px-1">{msg.time}</span>
                </div>
              );
            })}
          </div>

          {/* Chat Controls & Fast Actions */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              <button
                type="button"
                onClick={handleSendLocation}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 transition whitespace-nowrap shrink-0"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>📍 Отправить геолокацию Мудьюга</span>
              </button>

              <button
                type="button"
                onClick={() => handleCallbackClick('vote_yes', '🔥 Я в экипаже')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 transition whitespace-nowrap shrink-0"
              >
                <span>🔥 Я в экипаже</span>
              </button>

              <button
                type="button"
                onClick={() => handleCallbackClick('vote_no', '🫡 Не иду')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 transition whitespace-nowrap shrink-0"
              >
                <span>🫡 Не иду</span>
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Напишите в чат (например: Собираемся в субботу?)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={simulating || !inputText.trim()}
                className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white transition shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Google Docs / Spark Sync Journal */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Журнал Синхронизации Spark</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Google Docs • Spark Loop
            </span>
          </div>

          <div className="text-xs text-slate-400 py-2 border-b border-slate-800/60">
            Все сообщения, голоса за экипаж и отправленные точки немедленно регистрируются в памяти бота и документе.
          </div>

          {/* Log Entries list */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">Журнал пуст.</div>
            ) : (
              logs.map(l => (
                <div
                  key={l.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-sky-400 font-bold">{l.role}</span>
                    <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300 break-words">{l.text}</div>
                </div>
              ))
            )}
          </div>

          {/* Real Telegram Message Broadcast Test */}
          <form
            onSubmit={handleSendReal}
            className="pt-3 border-t border-slate-800 space-y-2 text-xs"
          >
            <div className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Отправка в живой Telegram-чат:</span>
              <span className="text-[10px] text-slate-500">Через bot.callApi</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={realMessageText}
                onChange={e => setRealMessageText(e.target.value)}
                placeholder="Текст оповещения экипажа в Telegram..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shrink-0"
              >
                Отправить
              </button>
            </div>
            {realSendStatus && (
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                {realSendStatus}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
