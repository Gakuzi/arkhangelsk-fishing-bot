import React from 'react';
import {
  Compass,
  Fish,
  RotateCw,
  Anchor,
  User,
  MapPin,
  CalendarDays
} from 'lucide-react';
import { UserProfile } from '../../types/index.ts';
import { hapticFeedback, isInsideTelegram } from '../../services/telegramWebApp.ts';

export type ActiveTab = 'trips' | 'spots' | 'history' | 'profile';

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

  const tabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'trips', label: 'Рыбалки', icon: CalendarDays },
    { id: 'spots', label: 'Точки лова', icon: Compass },
    { id: 'history', label: 'Уловы', icon: Fish },
    { id: 'profile', label: 'Профиль', icon: User }
  ];

  return (
    <>
      {/* Top Header - Liquid Glass Header */}
      <header className="sticky top-0 z-30 liquid-glass border-b border-white/80 pt-[env(safe-area-inset-top)] transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 gap-3">
            {/* Logo & Region */}
            <div
              onClick={() => handleTabClick('trips')}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Anchor className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm sm:text-base tracking-tight truncate">
                    Поморский Рыбак
                  </span>
                  {inTelegram && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                      Telegram
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3 text-sky-500 inline" />
                  Архангельск • Белое море • Северная Двина
                </div>
              </div>
            </div>

            {/* Right: Sync & Profile badge */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  hapticFeedback('light');
                  if (onRefresh) onRefresh();
                }}
                title="Синхронизировать данные"
                className="p-2.5 rounded-2xl bg-white/70 hover:bg-white active:scale-95 border border-white/90 shadow-sm text-slate-600 hover:text-sky-600 transition"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleTabClick('profile')}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition border ${
                  activeTab === 'profile'
                    ? 'bg-sky-50/90 border-sky-300 text-sky-900 shadow-sm'
                    : 'bg-white/70 hover:bg-white border-white/90 text-slate-700 shadow-sm'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-sky-100 border border-white overflow-hidden flex items-center justify-center text-xs font-bold text-sky-800 shadow-inner">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{user?.name?.[0] || 'Р'}</span>
                  )}
                </div>
                <div className="text-left hidden xs:block sm:block max-w-[120px]">
                  <div className="text-xs font-semibold text-slate-800 truncate leading-tight">
                    {user?.name || 'Рыбак'}
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium truncate leading-tight">
                    {user?.telegramUsername ? `@${user.telegramUsername}` : 'Кабинет'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2 py-2 border-t border-slate-200/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'trips' && tripsCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {tripsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Floating Liquid Glass Dock */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="liquid-glass rounded-3xl p-1.5 shadow-xl shadow-slate-900/10 border border-white/90 grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {tab.id === 'trips' && tripsCount > 0 && !isActive && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-sky-500 text-[9px] text-white flex items-center justify-center font-bold">
                      {tripsCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
