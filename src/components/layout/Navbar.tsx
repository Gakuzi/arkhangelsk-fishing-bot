import React from 'react';
import {
  Anchor,
  Calendar,
  Fish,
  MapPin,
  User,
  Bot,
  ChevronDown,
  Sparkles,
  Smartphone,
  Shield
} from 'lucide-react';
import { UserProfile, BotStatus } from '../../types/index.ts';
import { hapticFeedback, isInsideTelegram, getTelegramPlatform } from '../../services/telegramWebApp.ts';

export type ActiveTab = 'trips' | 'history' | 'spots' | 'profile';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  users: UserProfile[];
  activeUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  botStatus: BotStatus | null;
  tripsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  users,
  activeUser,
  onSelectUser,
  botStatus,
  tripsCount
}) => {
  const inTelegram = isInsideTelegram();
  const platform = getTelegramPlatform();

  const handleTabClick = (tab: ActiveTab) => {
    hapticFeedback('light');
    onTabChange(tab);
  };

  return (
    <>
      {/* Top Header - Works on both PC and Mobile */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between py-2.5 sm:py-3 gap-2 sm:gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-sky-950/50 shrink-0">
                <Anchor className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-slate-100 text-sm sm:text-lg tracking-tight truncate">
                    Архангельск • Рыбалка
                  </span>
                  {inTelegram && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      TG WebApp
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2">
                  <span>Северная Двина & Белое Море</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-400 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-400" />
                    Telegram Mini App
                  </span>
                </div>
              </div>
            </div>

            {/* Right Controls: Bot chip & Profile Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Bot Status */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className={`w-2 h-2 rounded-full ${botStatus?.isPolling ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`}></span>
                <span className="text-slate-400">Бот:</span>
                <span className="font-mono font-medium text-slate-200">@{botStatus?.botUsername || 'ArkhangelskFishingBot'}</span>
              </div>

              {/* User Selector Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition">
                  {activeUser?.avatarUrl ? (
                    <img
                      src={activeUser.avatarUrl}
                      alt={activeUser.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-sky-500/50"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sky-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {activeUser?.name?.[0] || 'Р'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium text-slate-200 leading-tight max-w-[120px] truncate">
                      {activeUser?.name || 'Рыбак'}
                    </div>
                    <div className="text-[10px] text-sky-400 leading-tight truncate">
                      {activeUser?.experienceLevel || 'Помор'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1.5 w-60 sm:w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
                  <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1.5 uppercase tracking-wider">
                    Рыбаки экипажа:
                  </div>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        hapticFeedback('medium');
                        onSelectUser(u);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition ${
                        activeUser?.id === u.id
                          ? 'bg-sky-950/80 text-sky-200 font-semibold border border-sky-800/60'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-medium text-[11px] text-slate-200 shrink-0">
                        {u.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">@{u.telegramUsername}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop & Tablet Top Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 py-2 border-t border-slate-800/60 text-sm">
            <button
              onClick={() => handleTabClick('trips')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition ${
                activeTab === 'trips'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Запланированные рыбалки</span>
              {tripsCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${activeTab === 'trips' ? 'bg-sky-800 text-sky-100' : 'bg-slate-800 text-slate-300'}`}>
                  {tripsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Fish className="w-4 h-4" />
              <span>История и уловы</span>
            </button>

            <button
              onClick={() => handleTabClick('spots')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition ${
                activeTab === 'spots'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Точки и карта</span>
            </button>

            <button
              onClick={() => handleTabClick('profile')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition ${
                activeTab === 'profile'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Личный кабинет</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Optimized for Telegram WebApp Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)] px-2 pt-1 shadow-2xl">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleTabClick('trips')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'trips'
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Calendar className="w-5 h-5" />
              {tripsCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-sky-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {tripsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 leading-none">Выезды</span>
          </button>

          <button
            onClick={() => handleTabClick('history')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'history'
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fish className="w-5 h-5" />
            <span className="text-[10px] mt-1 leading-none">Уловы</span>
          </button>

          <button
            onClick={() => handleTabClick('spots')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'spots'
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] mt-1 leading-none">Точки</span>
          </button>

          <button
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'profile'
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1 leading-none">Кабинет</span>
          </button>
        </div>
      </div>
    </>
  );
};
