import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/layout/Navbar.tsx';
import { PlannedTripsView } from './components/trips/PlannedTripsView.tsx';
import { FishingHistoryView } from './components/history/FishingHistoryView.tsx';
import { FishingSpotsView } from './components/spots/FishingSpotsView.tsx';
import { UserProfileView } from './components/profile/UserProfileView.tsx';
import { api } from './services/api.ts';
import {
  initTelegramApp,
  getTelegramUser,
  isInsideTelegram,
  setBackButton,
  hideBackButton,
  sendDataToBot,
  hapticFeedback
} from './services/telegramWebApp.ts';
import {
  UserProfile,
  PlannedTrip,
  TripHistory,
  FishingSpot,
  LogEntry,
  BotStatus
} from './types/index.ts';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [trips, setTrips] = useState<PlannedTrip[]>([]);
  const [history, setHistory] = useState<TripHistory[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Telegram WebApp and read deep link tab
  useEffect(() => {
    initTelegramApp();

    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') as ActiveTab;
    if (tabParam && ['profile', 'trips', 'spots', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const loadAllData = async () => {
    try {
      const [usersData, tripsData, histData, spotsData, logsData, statusData] =
        await Promise.all([
          api.getUsers().catch(() => []),
          api.getTrips().catch(() => []),
          api.getHistory().catch(() => []),
          api.getSpots().catch(() => []),
          api.getLogs().catch(() => []),
          api.getBotStatus().catch(() => null)
        ]);

      setUsers(usersData);
      setTrips(tripsData);
      setHistory(histData);
      setSpots(spotsData);
      setLogs(logsData);
      if (statusData) setBotStatus(statusData);

      // Auto-detect Telegram User or create fallback
      const tgUser = getTelegramUser();
      if (usersData.length > 0) {
        setActiveUser(prev => {
          if (tgUser) {
            const matched = usersData.find(
              u =>
                (tgUser.username && u.telegramUsername.toLowerCase() === tgUser.username.toLowerCase()) ||
                u.id === `tg-${tgUser.id}` ||
                u.name.toLowerCase().includes(tgUser.first_name.toLowerCase())
            );
            if (matched) return matched;
          }
          if (prev) {
            const found = usersData.find(u => u.id === prev.id);
            if (found) return found;
          }
          return usersData[0];
        });
      } else {
        // If users table is empty in DB, initialize with current user info
        const defaultUser: UserProfile = {
          id: tgUser ? `tg-${tgUser.id}` : `u-${Date.now()}`,
          name: tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : 'Рыбак',
          telegramUsername: tgUser?.username || '',
          experienceLevel: 'Любитель',
          fishingStyles: ['Зимняя со льда', 'Мормышка'],
          boatType: 'Без техники',
          homeDistrict: 'Архангельск',
          createdAt: new Date().toISOString().split('T')[0]
        };
        api.updateProfile(defaultUser.id, defaultUser).then(saved => {
          setActiveUser(saved);
          setUsers([saved]);
        }).catch(() => {
          setActiveUser(defaultUser);
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize native Telegram BackButton with active tab
  useEffect(() => {
    if (activeTab !== 'profile') {
      setBackButton(() => {
        hapticFeedback('selection');
        setActiveTab('profile');
      }, true);
    } else {
      hideBackButton();
    }
  }, [activeTab]);

  // Handlers
  const handleCreateUser = async (name: string, telegramUsername: string) => {
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name,
      telegramUsername,
      experienceLevel: 'Любитель',
      fishingStyles: ['Зимняя со льда'],
      boatType: 'Без техники',
      homeDistrict: 'Архангельск',
      createdAt: new Date().toISOString().split('T')[0]
    };
    try {
      const saved = await api.updateProfile(newUser.id, newUser);
      setActiveUser(saved);
      await loadAllData();
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!activeUser) return;
    const updated = await api.updateProfile(activeUser.id, updates);
    setActiveUser(updated);
    hapticFeedback('success');
    await loadAllData();
  };

  const handleJoinTrip = async (tripId: string) => {
    if (!activeUser) return;
    const trip = trips.find(t => t.id === tripId);
    await api.joinTrip(tripId, activeUser.id);
    hapticFeedback('success');
    if (isInsideTelegram() && trip) {
      sendDataToBot({
        action: 'join_crew',
        tripId: trip.id,
        tripTitle: trip.title,
        userId: activeUser.id,
        userName: activeUser.name
      });
    }
    await loadAllData();
  };

  const handleLeaveTrip = async (tripId: string) => {
    if (!activeUser) return;
    await api.leaveTrip(tripId, activeUser.id);
    hapticFeedback('medium');
    await loadAllData();
  };

  const handleCreateTrip = async (tripData: any) => {
    await api.createTrip(tripData);
    hapticFeedback('success');
    await loadAllData();
  };

  const handleAddHistory = async (entry: any) => {
    await api.addHistory(entry);
    hapticFeedback('success');
    if (isInsideTelegram() && entry.catches?.length) {
      const topCatch = entry.catches[0];
      sendDataToBot({
        action: 'add_catch',
        fish: topCatch.fishType,
        weight: topCatch.weightKg,
        spot: entry.locationName
      });
    }
    await loadAllData();
  };

  const handleAddSpot = async (spot: any) => {
    await api.addSpot(spot);
    hapticFeedback('success');
    if (isInsideTelegram() && spot) {
      sendDataToBot({
        action: 'add_spot',
        name: spot.name,
        lat: spot.lat,
        lon: spot.lon
      });
    }
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-slate-700 selection:text-white">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        users={users}
        activeUser={activeUser}
        onSelectUser={setActiveUser}
        onCreateUser={handleCreateUser}
        botStatus={botStatus}
        tripsCount={trips.filter(t => t.status === 'Набор открыт').length}
      />

      {/* Main Content with bottom padding for mobile Telegram navigation */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3.5 sm:p-6 pb-24 md:pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-xs text-slate-500">
            Загрузка личного кабинета...
          </div>
        ) : (
          <>
            {activeTab === 'profile' && activeUser && (
              <UserProfileView
                user={activeUser}
                onSaveProfile={handleSaveProfile}
                history={history}
                trips={trips}
                spots={spots}
                onCreateTrip={handleCreateTrip}
                onAddSpot={handleAddSpot}
                onAddHistory={handleAddHistory}
              />
            )}

            {activeTab === 'trips' && (
              <PlannedTripsView
                trips={trips}
                activeUser={activeUser}
                onJoinTrip={handleJoinTrip}
                onLeaveTrip={handleLeaveTrip}
                onCreateTrip={handleCreateTrip}
              />
            )}

            {activeTab === 'history' && (
              <FishingHistoryView
                history={history}
                activeUser={activeUser}
                onAddHistory={handleAddHistory}
              />
            )}

            {activeTab === 'spots' && (
              <FishingSpotsView
                spots={spots}
                activeUser={activeUser}
                onAddSpot={handleAddSpot}
              />
            )}
          </>
        )}
      </main>

      <footer className="hidden md:block border-t border-slate-900 bg-slate-950 py-3.5 px-4 text-center text-[11px] text-slate-400">
        Поморский Рыбак • Архангельск & Северодвинск • Белое Море & Дельта Северной Двины
      </footer>
    </div>
  );
}

export default App;
