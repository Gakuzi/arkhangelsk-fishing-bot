import {
  UserProfile,
  PlannedTrip,
  TripHistory,
  FishingSpot,
  LogEntry,
  SparkCommand,
  BotStatus,
  FishingGear
} from '../types/index.ts';

export const api = {
  // Config & Status
  async getBotStatus(): Promise<BotStatus> {
    const res = await fetch('/api/bot/status');
    return res.json();
  },

  // Users & Personal Telegram Cabinet
  async syncTelegramUser(data: {
    id: number | string;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  }): Promise<UserProfile> {
    const res = await fetch('/api/users/sync-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

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
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Gear (Снасти)
  async getGear(userId: string): Promise<FishingGear[]> {
    const res = await fetch(`/api/gear?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async addGear(gear: Omit<FishingGear, 'id' | 'createdAt'>): Promise<FishingGear> {
    const res = await fetch('/api/gear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gear)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateGear(id: string, updates: Partial<FishingGear>): Promise<FishingGear> {
    const res = await fetch(`/api/gear/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteGear(id: string): Promise<boolean> {
    const res = await fetch(`/api/gear/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
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
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateTrip(id: string, updates: Partial<PlannedTrip>): Promise<PlannedTrip> {
    const res = await fetch(`/api/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteTrip(id: string): Promise<boolean> {
    const res = await fetch(`/api/trips/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  async joinTrip(tripId: string, userId: string): Promise<{ success: boolean; message: string; trip?: PlannedTrip }> {
    const res = await fetch(`/api/trips/${tripId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async leaveTrip(tripId: string, userId: string): Promise<{ success: boolean; message: string; trip?: PlannedTrip }> {
    const res = await fetch(`/api/trips/${tripId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error(await res.text());
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
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateHistory(id: string, updates: Partial<TripHistory>): Promise<TripHistory> {
    const res = await fetch(`/api/history/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteHistory(id: string): Promise<boolean> {
    const res = await fetch(`/api/history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
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
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateSpot(id: string, updates: Partial<FishingSpot>): Promise<FishingSpot> {
    const res = await fetch(`/api/spots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteSpot(id: string): Promise<boolean> {
    const res = await fetch(`/api/spots/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
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
