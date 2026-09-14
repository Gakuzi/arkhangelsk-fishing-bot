import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { TelegramSimulator } from './components/TelegramSimulator.tsx';
import { FishingSpotsMap } from './components/FishingSpotsMap.tsx';
import { CrewRoster } from './components/CrewRoster.tsx';
import { JournalLogs } from './components/JournalLogs.tsx';
import { BotConfig, LogEntry, FishingSpot, CrewMember, SparkCommand } from './types.ts';
import { Terminal, ShieldCheck, MapPin, Users, Activity } from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [queue, setQueue] = useState<SparkCommand[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [cfgRes, logsRes, spotsRes, crewRes, qRes] = await Promise.all([
        fetch('/api/config').catch(() => null),
        fetch('/api/logs').catch(() => null),
        fetch('/api/spots').catch(() => null),
        fetch('/api/crew').catch(() => null),
        fetch('/api/queue').catch(() => null)
      ]);

      if (cfgRes?.ok) setConfig(await cfgRes.json());
      if (logsRes?.ok) setLogs(await logsRes.json());
      if (spotsRes?.ok) setSpots(await spotsRes.json());
      if (crewRes?.ok) setCrew(await crewRes.json());
      if (qRes?.ok) setQueue(await qRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      <Header
        config={config}
        logsCount={logs.length}
        spotsCount={spots.length}
        crewCount={crew.filter(c => c.vote === 'yes').length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Status banner */}
        <div className="rounded-xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/50 border border-sky-800/30 p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-semibold text-slate-100">
                Миграция Python бота в Node.js / React успешно выполнена
              </div>
              <div className="text-slate-400 text-xs mt-0.5">
                Все оригинальные сценарии (журнал Google Docs, точки лова, реакция «👀», Spark Queue, экипаж) работают через встроенный API.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Порт: 3000
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300">
              Эмуляция + Webhook
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Telegram Simulator (takes 6 cols on large screens) */}
          <div className="lg:col-span-6 h-[640px] flex flex-col">
            <TelegramSimulator onRefreshData={fetchData} />
          </div>

          {/* Right Column: Dashboard Tabs / Modules (takes 6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-full min-h-[340px]">
                <FishingSpotsMap spots={spots} onSpotAdded={fetchData} />
              </div>
              <div className="h-full min-h-[340px]">
                <CrewRoster crew={crew} onVoteRecorded={fetchData} />
              </div>
            </div>

            <div className="min-h-[280px]">
              <JournalLogs logs={logs} queue={queue} onRefresh={fetchData} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Архангельск • Рыбалка на Северной Двине и Белом Море • Telegram Bot Spark Migration
      </footer>
    </div>
  );
}

export default App;
