import React, { useState } from 'react';
import {
  Anchor,
  User,
  Calendar,
  Compass,
  Fish,
  ChevronDown,
  Smartphone,
  Plus,
  LogOut,
  UserPlus,
  Check
} from 'lucide-react';
import { UserProfile, BotStatus } from '../../types/index.ts';
import { hapticFeedback, isInsideTelegram, getTelegramUser } from '../../services/telegramWebApp.ts';

export type ActiveTab = 'profile' | 'trips' | 'spots' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  users: UserProfile[];
  activeUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onCreateUser?: (name: string, username: string) => void;
  botStatus: BotStatus | null;
  tripsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  users,
  activeUser,
  onSelectUser,
  onCreateUser,
  botStatus,
  tripsCount
}) => {
  const inTelegram = isInsideTelegram();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserTg, setNewUserTg] = useState('');

  const handleTabClick = (tab: ActiveTab) => {
    hapticFeedback('light');
    onTabChange(tab);
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    if (onCreateUser) {
      onCreateUser(newUserName.trim(), newUserTg.trim().replace(/^@/, ''));
    }
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserTg('');
  };

  return (
    <>
      {/* Top Header - Minimalist & Laconic */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 gap-3">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-750 flex items-center justify-center text-slate-300 shrink-0">
                <Anchor className="w-4 h-4 text-slate-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100 text-sm sm:text-base tracking-tight truncate">
                    Поморский Рыбак
                  </span>
                  {inTelegram && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-850 text-emerald-400 border border-slate-750 shrink-0">
                      Telegram
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block truncate">
                  Архангельск • Белое Море & Дельта Двины
                </div>
              </div>
            </div>

            {/* Right: User Switcher / Telegram Account */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                    {activeUser?.avatarUrl ? (
                      <img src={activeUser.avatarUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      activeUser?.name?.[0] || 'Р'
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium text-slate-200 leading-tight max-w-[120px] truncate">
                      {activeUser?.name || 'Рыбак'}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight truncate">
                      @{activeUser?.telegramUsername || 'id'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                    <div className="text-[10px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                      Личные кабинеты:
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {users.map(u => {
                        const isCurrent = activeUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              hapticFeedback('medium');
                              onSelectUser(u);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                              isCurrent
                                ? 'bg-slate-800 text-slate-100 font-medium'
                                : 'text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate text-slate-200">{u.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">@{u.telegramUsername}</div>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowAddUserModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Новый рыбак / профиль</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Minimalist Tabs */}
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
              <span>Все выезды</span>
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
              <span>Карта и точки</span>
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

      {/* Mobile Bottom Navigation Bar (Minimalist & Functional) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)] px-3 py-1 shadow-2xl">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[46px] ${
              activeTab === 'profile'
                ? 'text-slate-100 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] mt-1">Кабинет</span>
          </button>

          <button
            onClick={() => handleTabClick('trips')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[46px] ${
              activeTab === 'trips'
                ? 'text-slate-100 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <Calendar className="w-4 h-4" />
              {tripsCount > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-slate-700 text-[9px] text-slate-200 flex items-center justify-center font-bold">
                  {tripsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1">Выезды</span>
          </button>

          <button
            onClick={() => handleTabClick('spots')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[46px] ${
              activeTab === 'spots'
                ? 'text-slate-100 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] mt-1">Карта</span>
          </button>

          <button
            onClick={() => handleTabClick('history')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition min-h-[46px] ${
              activeTab === 'history'
                ? 'text-slate-100 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Fish className="w-4 h-4" />
            <span className="text-[10px] mt-1">Уловы</span>
          </button>
        </div>
      </div>

      {/* Modal: Create User / Register via Telegram */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateNewUser}
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">Новый профиль рыбака</h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Отмена
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Имя *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Иван Помор"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Ник в Telegram (@username)</label>
                <input
                  type="text"
                  value={newUserTg}
                  onChange={e => setNewUserTg(e.target.value)}
                  placeholder="ivan_rybak"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!newUserName.trim()}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-white text-slate-900 text-xs font-medium transition shadow-sm"
              >
                Создать кабинет
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
