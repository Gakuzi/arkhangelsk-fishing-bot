import {
  UserProfile,
  PlannedTrip,
  TripHistory,
  FishingSpot,
  LogEntry,
  SparkCommand,
  BotStatus
} from '../types/index.ts';

export const api = {
  // Config & Status
  async getBotStatus(): Promise<BotStatus> {
    const res = await fetch('/api/bot/status');
    return res.json();
  },

  // Users
  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch('/api/users');
    return res.json();
  },

  async getUser(id: string): Promise<UserProfile> {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`/api/users/${id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Planned Trips
  async getTrips(): Promise<PlannedTrip[]> {
    const res = await fetch('/api/trips');
    return res.json();
  },

  async createTrip(trip: Partial<PlannedTrip> & { organizerId: string }): Promise<PlannedTrip> {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip)
    });
    return res.json();
  },

  async joinTrip(tripId: string, userId: string): Promise<{ success: boolean; message: string; trip?: PlannedTrip }> {
    const res = await fetch(`/api/trips/${tripId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async leaveTrip(tripId: string, userId: string): Promise<{ success: boolean; message: string; trip?: PlannedTrip }> {
    const res = await fetch(`/api/trips/${tripId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  // History & Catches
  async getHistory(): Promise<TripHistory[]> {
    const res = await fetch('/api/history');
    return res.json();
  },

  async addHistory(entry: Partial<TripHistory>): Promise<TripHistory> {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return res.json();
  },

  // Spots
  async getSpots(): Promise<FishingSpot[]> {
    const res = await fetch('/api/spots');
    return res.json();
  },

  async addSpot(spot: Partial<FishingSpot>): Promise<FishingSpot> {
    const res = await fetch('/api/spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spot)
    });
    return res.json();
  },

  // Logs & Simulation
  async getLogs(): Promise<LogEntry[]> {
    const res = await fetch('/api/logs');
    return res.json();
  },

  async getQueue(): Promise<SparkCommand[]> {
    const res = await fetch('/api/queue');
    return res.json();
  },

  async simulateBotMessage(payload: {
    messageType: 'text' | 'location' | 'callback';
    text?: string;
    location?: { lat: number; lon: number; name?: string };
    user: string;
    action?: string;
    isGroup?: boolean;
  }) {
    const res = await fetch('/api/bot/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async sendTelegramMessage(text: string, chatId?: string) {
    const res = await fetch('/api/bot/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, chatId })
    });
    return res.json();
  }
};
