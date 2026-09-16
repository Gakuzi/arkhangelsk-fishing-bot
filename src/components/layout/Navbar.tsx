import React from 'react';
import {
  Anchor,
  User,
  Calendar,
  Compass,
  Fish,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../../types/index.ts';
import { hapticFeedback, isInsideTelegram } from '../../services/telegramWebApp.ts';

export type ActiveTab = 'profile' | 'trips' | 'spots' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: UserProfile | null;
  onRefresh?: () => void;
  tripsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  user,
  onRefresh,
  tripsCount
}) => {
  const inTelegram = isInsideTelegram();

  const handleTabClick = (tab: ActiveTab) => {
    hapticFeedback('light');
    onTabChange(tab);
  };

  return (
    <>
      {/* Top Header - Personal Telegram Mini App */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-850 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-2.5 gap-3">
            {/* Brand Logo & Title */}
            <div
              onClick={() => handleTabClick('profile')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 shrink-0 shadow-sm">
                <Anchor className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-100 text-sm sm:text-base tracking-tight truncate">
                    Поморский Рыбак
                  </span>
                  {inTelegram && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shrink-0">
                      Telegram
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Архангельск • Белое Море & Дельта Двины
                </div>
              </div>
            </div>

            {/* Right: Personal Cabinet Identity & Refresh */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  hapticFeedback('light');
                  if (onRefresh) onRefresh();
                }}
                title="Синхронизировать данные"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 active:scale-95 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Single User Identity Chip (NO switching, strictly personal cabinet) */}
              <button
                onClick={() => handleTabClick('profile')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition text-left ${
                  activeTab === 'profile'
                    ? 'bg-slate-900 border-sky-500/50 shadow-sm'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
                }`}
                title="Перейти в личный кабинет"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span>{user?.name?.[0] || 'Р'}</span>
                  )}
                </div>
                <div className="text-left hidden xs:block sm:block max-w-[130px]">
                  <div className="text-xs font-medium text-slate-200 leading-tight truncate">
                    {user?.name || 'Личный кабинет'}
                  </div>
                  <div className="text-[10px] text-sky-400/90 leading-tight truncate font-mono">
                    {user?.telegramUsername ? `@${user.telegramUsername}` : 'Кабинет'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 py-2 border-t border-slate-850 text-xs">
            <button
              onClick={() => handleTabClick('profile')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'profile'
                  ? 'bg-slate-200 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Личный кабинет</span>
            </button>

            <button
              onClick={() => handleTabClick('trips')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'trips'
                  ? 'bg-slate-200 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Выезды на рыбалку</span>
              {tripsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                  {tripsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('spots')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'spots'
                  ? 'bg-slate-200 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Карта и точки лова</span>
            </button>

            <button
              onClick={() => handleTabClick('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'history'
                  ? 'bg-slate-200 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Fish className="w-3.5 h-3.5" />
              <span>Журнал уловов</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)] px-3 py-1 shadow-2xl">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'profile'
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] mt-1">Кабинет</span>
          </button>

          <button
            onClick={() => handleTabClick('trips')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'trips'
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Calendar className="w-4 h-4" />
              {tripsCount > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-sky-500 text-[9px] text-slate-950 flex items-center justify-center font-bold">
                  {tripsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1">Выезды</span>
          </button>

          <button
            onClick={() => handleTabClick('spots')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'spots'
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] mt-1">Точки</span>
          </button>

          <button
            onClick={() => handleTabClick('history')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'history'
                ? 'text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fish className="w-4 h-4" />
            <span className="text-[10px] mt-1">Уловы</span>
          </button>
        </div>
      </div>
    </>
  );
};
