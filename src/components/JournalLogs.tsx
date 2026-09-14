import React, { useState } from 'react';
import { FileText, MapPin, Users, Bot, RefreshCw, Cpu, Layers } from 'lucide-react';
import { LogEntry, SparkCommand } from '../types.ts';

interface JournalLogsProps {
  logs: LogEntry[];
  queue: SparkCommand[];
  onRefresh: () => void;
}

export const JournalLogs: React.FC<JournalLogsProps> = ({ logs, queue, onRefresh }) => {
  const [filter, setFilter] = useState<'all' | 'text' | 'location' | 'vote' | 'system'>('all');
  const [activeTab, setActiveTab] = useState<'journal' | 'queue'>('journal');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Журнал Синхронизации (Docs & Spark)</h2>
            <p className="text-xs text-slate-400">Аналог LOG_DOC_ID и QUEUE_DOC_ID из bot.py</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'journal'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Журнал ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Очередь Spark ({queue.length})</span>
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Обновить данные"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {activeTab === 'journal' ? (
        <div className="flex flex-col flex-1 mt-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 mb-3 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Все записи
            </button>
            <button
              onClick={() => setFilter('text')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filter === 'text'
                  ? 'bg-sky-900/70 text-sky-200 border border-sky-700'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Сообщения
            </button>
            <button
              onClick={() => setFilter('location')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filter === 'location'
                  ? 'bg-emerald-900/70 text-emerald-200 border border-emerald-700'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Геолокации
            </button>
            <button
              onClick={() => setFilter('vote')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filter === 'vote'
                  ? 'bg-amber-900/70 text-amber-200 border border-amber-700'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Голосования
            </button>
          </div>

          {/* Logs Stream */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-72 pr-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-sans">Журнал пуст</div>
            ) : (
              filteredLogs.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5"
                >
                  <span className="text-slate-500 shrink-0 select-none">[{item.timestamp}]</span>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`font-semibold mr-1.5 ${
                        item.role === 'ГОЛОСОВАНИЕ'
                          ? 'text-amber-400'
                          : item.role === 'СИСТЕМА'
                          ? 'text-sky-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {item.role}:
                    </span>
                    <span className="text-slate-200 break-words">{item.text}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 mt-3">
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Командная очередь Spark (process_spark_queue) опрашивает очередь и рассылает обновления в Telegram.
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-72 pr-1 text-xs">
            {queue.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-sans">Очередь Spark пуста</div>
            ) : (
              queue.map(q => (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-indigo-400 font-semibold">Метод: {q.method}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        q.status === 'delivered'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {q.status === 'delivered' ? 'Доставлено' : 'В ожидании'}
                    </span>
                  </div>
                  <pre className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg overflow-x-auto">
                    {JSON.stringify(q.payload, null, 2)}
                  </pre>
                  <div className="mt-1.5 text-[10px] text-slate-500 flex justify-end">
                    Создано: {q.createdAt}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
