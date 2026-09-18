import React, { useState, useEffect, useCallback } from 'react';
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

function createInitialProfile(): UserProfile {
  // 1. Try local storage cache
  try {
    const cached = localStorage.getItem('pomor_profile_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.id) return parsed;
    }
  } catch {}

  // 2. Try Telegram WebApp user
  const tgUser = getTelegramUser();
  if (tgUser && tgUser.id) {
    const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() || (tgUser.username ? `@${tgUser.username}` : 'Поморский Рыбак');
    return {
      id: `tg-${tgUser.id}`,
      name,
      telegramUsername: tgUser.username || '',
      phone: '',
      experienceLevel: 'Любитель',
      fishingStyles: ['Зимняя со льда', 'Мормышка'],
      boatType: 'Без техники',
      homeDistrict: 'Архангельск',
      bio: 'Поморский рыбак',
      avatarUrl: tgUser.photo_url || '',
      transportName: 'Нива 4x4 / УАЗ',
      totalSeats: 4,
      availableSeats: 3,
      fuelType: 'АИ-92',
      fuelPricePerLiter: 58.0,
      fuelConsumptionPer100km: 11.5,
      tankCapacityLiters: 55.0,
      createdAt: new Date().toISOString().split('T')[0]
    };
  }

  // 3. Fallback default
  return {
    id: 'EKlimov84',
    name: 'Евгений Климов',
    telegramUsername: 'EKlimov84',
    phone: '',
    experienceLevel: 'Эксперт',
    fishingStyles: ['Зимняя со льда', 'Мормышка', 'Троллинг'],
    boatType: 'Казанка 5М / Мотор 30 л.с.',
    homeDistrict: 'Архангельск (Соломбала)',
    bio: 'Поморский рыбак. Знаю фарватеры Северной Двины и Сухое море.',
    avatarUrl: '',
    transportName: 'УАЗ Патриот 4x4',
    totalSeats: 4,
    availableSeats: 2,
    fuelType: 'АИ-92',
    fuelPricePerLiter: 56.5,
    fuelConsumptionPer100km: 12.5,
    tankCapacityLiters: 68.0,
    createdAt: new Date().toISOString().split('T')[0]
  };
}

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [user, setUser] = useState<UserProfile>(createInitialProfile);
  const [trips, setTrips] = useState<PlannedTrip[]>([]);
  const [history, setHistory] = useState<TripHistory[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Telegram WebApp (ready, expand to full screen) & read URL deep-link
  useEffect(() => {
    initTelegramApp();

    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') as ActiveTab;
    if (tabParam && ['profile', 'trips', 'spots', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Synchronize Personal Telegram Cabinet & Load Data
  const loadAllData = useCallback(async () => {
    try {
      const tgUser = getTelegramUser();
      let personalProfile: UserProfile | null = null;

      if (tgUser && tgUser.id) {
        // Authenticated Telegram Mini App: strictly 1 Telegram ID = 1 Personal Cabinet
        try {
          personalProfile = await api.syncTelegramUser({
            id: tgUser.id,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            username: tgUser.username,
            photoUrl: tgUser.photo_url
          });
        } catch (syncErr) {
          console.warn('Failed to sync Telegram profile with backend:', syncErr);
        }
      }

      // Fetch all public shared data (trips, spots, reports)
      const [tripsData, histData, spotsData, logsData, statusData] =
        await Promise.all([
          api.getTrips().catch(() => []),
          api.getHistory().catch(() => []),
          api.getSpots().catch(() => []),
          api.getLogs().catch(() => []),
          api.getBotStatus().catch(() => null)
        ]);

      if (tripsData?.length) setTrips(tripsData);
      if (histData?.length) setHistory(histData);
      if (spotsData?.length) setSpots(spotsData);
      if (logsData?.length) setLogs(logsData);
      if (statusData) setBotStatus(statusData);

      // If user profile is received from backend
      if (personalProfile) {
        setUser(personalProfile);
        try {
          localStorage.setItem('pomor_profile_cache', JSON.stringify(personalProfile));
          localStorage.setItem('pomor_last_tg_id', personalProfile.id);
        } catch {}
      } else {
        // Browser / Local Dev fallback: find previously synced user or Evgeny Klimov
        try {
          const existingUsers = await api.getUsers().catch(() => []);
          let lastSavedId: string | null = null;
          try {
            lastSavedId = localStorage.getItem('pomor_last_tg_id');
          } catch {}

          const userBySavedId = lastSavedId ? existingUsers.find(u => u.id === lastSavedId) : null;
          const userByUsername = existingUsers.find(
            u => (u.telegramUsername || '').toLowerCase() === 'eklimov84'
          );

          if (userBySavedId) {
            setUser(userBySavedId);
            localStorage.setItem('pomor_profile_cache', JSON.stringify(userBySavedId));
          } else if (userByUsername) {
            setUser(userByUsername);
            localStorage.setItem('pomor_profile_cache', JSON.stringify(userByUsername));
          } else if (existingUsers.length > 0) {
            setUser(existingUsers[0]);
            localStorage.setItem('pomor_profile_cache', JSON.stringify(existingUsers[0]));
          }
        } catch {}
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    // Refresh data only when tab is visible, every 45 seconds to reduce server load
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadAllData();
    }, 45000);
    return () => clearInterval(interval);
  }, [loadAllData]);

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

  // Handlers for Personal Cabinet
  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const updated = await api.updateProfile(user.id, updates);
      setUser(updated);
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const handleJoinTrip = async (tripId: string) => {
    if (!user) return;
    const trip = trips.find(t => t.id === tripId);
    await api.joinTrip(tripId, user.id);
    hapticFeedback('success');
    if (isInsideTelegram() && trip) {
      sendDataToBot({
        action: 'join_crew',
        tripId: trip.id,
        tripTitle: trip.title,
        userId: user.id,
        userName: user.name
      });
    }
    await loadAllData();
  };

  const handleLeaveTrip = async (tripId: string, reason?: string) => {
    if (!user) return;
    const trip = trips.find(t => t.id === tripId);
    await api.leaveTrip(tripId, user.id);
    hapticFeedback('medium');
    
    if (isInsideTelegram() && trip && reason) {
      await api.simulateBotMessage({
        messageType: 'text',
        text: `Я не смогу поехать на выезд "${trip.title}", так как: ${reason}`,
        user: user.name
      });
    }
    
    await loadAllData();
  };

  const handleEditTrip = async (tripId: string, tripData: any) => {
    await api.updateTrip(tripId, tripData);
    hapticFeedback('success');
    await loadAllData();
  };

  const handleDeleteTrip = async (tripId: string) => {
    await api.deleteTrip(tripId);
    hapticFeedback('heavy');
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

  const handleEditHistory = async (id: string, updates: any) => {
    await api.updateHistory(id, updates);
    hapticFeedback('success');
    await loadAllData();
  };

  const handleDeleteHistory = async (id: string) => {
    await api.deleteHistory(id);
    hapticFeedback('heavy');
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

  const handleEditSpot = async (id: string, updates: any) => {
    await api.updateSpot(id, updates);
    hapticFeedback('success');
    await loadAllData();
  };

  const handleDeleteSpot = async (id: string) => {
    await api.deleteSpot(id);
    hapticFeedback('heavy');
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-slate-700 selection:text-white">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onRefresh={loadAllData}
        tripsCount={trips.filter(t => t.status === 'Набор открыт').length}
      />

      {/* Main Content with bottom padding for mobile Telegram navigation */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 pb-24 md:pb-8">
        {loading && !user ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-sky-400 rounded-full animate-spin" />
            <span>Синхронизация профиля Telegram...</span>
          </div>
        ) : (
          <>
            {activeTab === 'profile' && (
              user ? (
                <UserProfileView
                  user={user}
                  onSaveProfile={handleSaveProfile}
                  history={history}
                  trips={trips}
                  spots={spots}
                  onCreateTrip={handleCreateTrip}
                  onAddSpot={handleAddSpot}
                  onAddHistory={handleAddHistory}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center">
                  <p className="text-slate-300 font-medium mb-2">Профиль загружается...</p>
                  <button
                    onClick={loadAllData}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-semibold text-white transition"
                  >
                    Повторить подключение
                  </button>
                </div>
              )
            )}

            {activeTab === 'trips' && (
              <PlannedTripsView
                trips={trips}
                activeUser={user}
                onJoinTrip={handleJoinTrip}
                onLeaveTrip={handleLeaveTrip}
                onCreateTrip={handleCreateTrip}
                onEditTrip={handleEditTrip}
                onDeleteTrip={handleDeleteTrip}
              />
            )}

            {activeTab === 'history' && (
              <FishingHistoryView
                history={history}
                activeUser={user}
                onAddHistory={handleAddHistory}
                onEditHistory={handleEditHistory}
                onDeleteHistory={handleDeleteHistory}
              />
            )}

            {activeTab === 'spots' && (
              <FishingSpotsView
                spots={spots}
                activeUser={user}
                onAddSpot={handleAddSpot}
                onEditSpot={handleEditSpot}
                onDeleteSpot={handleDeleteSpot}
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
