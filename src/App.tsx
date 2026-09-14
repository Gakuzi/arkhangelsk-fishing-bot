import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/layout/Navbar.tsx';
import { PlannedTripsView } from './components/trips/PlannedTripsView.tsx';
import { FishingHistoryView } from './components/history/FishingHistoryView.tsx';
import { FishingSpotsView } from './components/spots/FishingSpotsView.tsx';
import { UserProfileView } from './components/profile/UserProfileView.tsx';
import { TelegramBotConsole } from './components/bot/TelegramBotConsole.tsx';
import { api } from './services/api.ts';
import {
  initTelegramApp,
  getTelegramUser,
  isInsideTelegram
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('trips');
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
    if (tabParam && ['trips', 'history', 'spots', 'profile', 'bot'].includes(tabParam)) {
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

      // Auto-detect Telegram User
      const tgUser = getTelegramUser();
      if (usersData.length > 0) {
        setActiveUser(prev => {
          if (tgUser) {
            const matched = usersData.find(
              u =>
                (tgUser.username && u.telegramUsername.toLowerCase() === tgUser.username.toLowerCase()) ||
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

  // Handlers
  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!activeUser) return;
    const updated = await api.updateProfile(activeUser.id, updates);
    setActiveUser(updated);
    await loadAllData();
  };

  const handleJoinTrip = async (tripId: string) => {
    if (!activeUser) return;
    await api.joinTrip(tripId, activeUser.id);
    await loadAllData();
  };

  const handleLeaveTrip = async (tripId: string) => {
    if (!activeUser) return;
    await api.leaveTrip(tripId, activeUser.id);
    await loadAllData();
  };

  const handleCreateTrip = async (tripData: any) => {
    await api.createTrip(tripData);
    await loadAllData();
  };

  const handleAddHistory = async (entry: any) => {
    await api.addHistory(entry);
    await loadAllData();
  };

  const handleAddSpot = async (spot: any) => {
    await api.addSpot(spot);
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        users={users}
        activeUser={activeUser}
        onSelectUser={setActiveUser}
        botStatus={botStatus}
        tripsCount={trips.filter(t => t.status === 'Набор открыт').length}
      />

      {/* Main Content with bottom padding for mobile Telegram navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-slate-400">
            Загрузка приложения рыбака...
          </div>
        ) : (
          <>
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

            {activeTab === 'profile' && activeUser && (
              <UserProfileView
                user={activeUser}
                onSaveProfile={handleSaveProfile}
                history={history}
                trips={trips}
              />
            )}

            {activeTab === 'bot' && (
              <TelegramBotConsole
                botStatus={botStatus}
                logs={logs}
                activeUser={activeUser}
                onSimulateMessage={api.simulateBotMessage}
                onSendRealMessage={api.sendTelegramMessage}
                onRefreshData={loadAllData}
              />
            )}
          </>
        )}
      </main>

      <footer className="hidden md:block border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        Архангельск • Рыбалка на Северной Двине и Белом Море • Telegram Bot & Mini App
      </footer>
    </div>
  );
}

export default App;
