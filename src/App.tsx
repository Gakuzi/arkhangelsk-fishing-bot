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

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [trips, setTrips] = useState<PlannedTrip[]>([]);
  const [history, setHistory] = useState<TripHistory[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
          console.error('Failed to sync Telegram profile:', syncErr);
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

      setTrips(tripsData);
      setHistory(histData);
      setSpots(spotsData);
      setLogs(logsData);
      if (statusData) setBotStatus(statusData);

      // If user profile is not set yet (or browser outside Telegram)
      if (personalProfile) {
        setUser(personalProfile);
      } else if (!user) {
        // Browser / Local Dev fallback
        const existingUsers = await api.getUsers().catch(() => []);
        if (existingUsers.length > 0) {
          setUser(existingUsers[0]);
        } else {
          const fallbackUser = await api.syncTelegramUser({
            id: 'default-fisherman',
            firstName: 'Евгений',
            lastName: 'Климов',
            username: 'EKlimov84',
            photoUrl: ''
          });
          setUser(fallbackUser);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 12000);
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

  const handleLeaveTrip = async (tripId: string) => {
    if (!user) return;
    await api.leaveTrip(tripId, user.id);
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
            {activeTab === 'profile' && user && (
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
            )}

            {activeTab === 'trips' && (
              <PlannedTripsView
                trips={trips}
                activeUser={user}
                onJoinTrip={handleJoinTrip}
                onLeaveTrip={handleLeaveTrip}
                onCreateTrip={handleCreateTrip}
              />
            )}

            {activeTab === 'history' && (
              <FishingHistoryView
                history={history}
                activeUser={user}
                onAddHistory={handleAddHistory}
              />
            )}

            {activeTab === 'spots' && (
              <FishingSpotsView
                spots={spots}
                activeUser={user}
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
