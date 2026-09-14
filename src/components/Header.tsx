import React from 'react';
import { Anchor, Radio, Users, MapPin, FileText, Bot } from 'lucide-react';
import { BotConfig } from '../types.ts';

interface HeaderProps {
  config: BotConfig | null;
  logsCount: number;
  spotsCount: number;
  crewCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  logsCount,
  spotsCount,
  crewCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-900/60 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950/50">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                Архангельск Рыбалка Бот
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Node.js Сервер Активен
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Северная Двина • Белое Море</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-400">Чат: {config?.chatId || '-1004386693265'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Журнал: <strong className="text-slate-100">{logsCount}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Точек лова: <strong className="text-slate-100">{spotsCount}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Users className="w-4 h-4 text-amber-400" />
            <span>В экипаже: <strong className="text-slate-100">{crewCount}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-mono">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Spark AI Queue: OK</span>
          </div>
        </div>
      </div>
    </header>
  );
};
