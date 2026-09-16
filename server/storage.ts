export interface UserProfile {
  id: string;
  name: string;
  telegramUsername: string;
  phone?: string;
  experienceLevel: 'Новичок' | 'Любитель' | 'Опытный' | 'Бывалый помор';
  fishingStyles: string[];
  boatType: 'Без техники' | 'Мотособака / Буксировщик' | 'Снегоход' | 'Лодка ПВХ с мотором' | 'Катер';
  homeDistrict: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  // Transport & Fuel settings
  transportName?: string;
  totalSeats?: number;
  availableSeats?: number;
  fuelType?: 'АИ-92' | 'АИ-95' | 'Дизель' | 'Смесь 2Т (бензин+масло)' | 'Газ';
  fuelPricePerLiter?: number;
  fuelConsumptionPer100km?: number;
  tankCapacityLiters?: number;
}

export interface FishingGear {
  id: string;
  userId: string;
  name: string;
  category: 'Удилища и катушки' | 'Приманки и мормышки' | 'Зимнее снаряжение' | 'Электроника и навигация' | 'Транспорт и лодки' | 'Прочее';
  quantity?: number;
  notes?: string;
  isReady: boolean;
  createdAt: string;
}

export interface CatchItem {
  species: string;
  weightKg: number;
  count: number;
  isTrophy?: boolean;
}

export interface TripHistory {
  id: string;
  userId: string;
  authorName: string;
  date: string;
  location: string;
  coordinates?: { lat: number; lon: number };
  weather: string;
  durationHours: number;
  catches: CatchItem[];
  gearUsed: string[];
  baitUsed: string[];
  review: string;
  rating: number;
  depthMeters?: number;
  createdAt: string;
}

export interface PlannedTrip {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  destination: string;
  coordinates?: { lat: number; lon: number };
  targetFish: string[];
  date: string;
  meetTime: string;
  meetPlace: string;
  transportType: string;
  maxCrew: number;
  participants: {
    userId: string;
    userName: string;
    telegramUsername: string;
    role: 'Организатор' | 'Участник';
    joinedAt: string;
  }[];
  checklist: string[];
  status: 'Набор открыт' | 'Экипаж набран' | 'Выезд завершен' | 'Отменен';
  notes?: string;
  createdAt: string;
  // Fuel sharing & route parameters
  distanceKm?: number;
  fuelCostTotal?: number;
  costPerPerson?: number;
  fuelType?: string;
}

export interface FishingSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  area: string;
  recommendedFish: string[];
  season: string;
  description: string;
  depthMeters?: string;
  addedBy: string;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  role: string;
  text: string;
  type: 'text' | 'location' | 'vote' | 'system';
}

export interface SparkCommand {
  id: string;
  method: string;
  payload: Record<string, any>;
  createdAt: string;
  status: 'pending' | 'delivered';
}

// In-memory fallback / empty defaults
class StorageService {
  private users: UserProfile[] = [];
  private spots: FishingSpot[] = [];
  private plannedTrips: PlannedTrip[] = [];
  private history: TripHistory[] = [];
  private logs: LogEntry[] = [];
  private queue: SparkCommand[] = [];

  getUsers(): UserProfile[] {
    return this.users;
  }

  getUserById(id: string): UserProfile | undefined {
    return this.users.find(u => u.id === id);
  }

  updateProfile(id: string, updates: Partial<UserProfile>): UserProfile {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) {
      const newUser: UserProfile = {
        id,
        name: updates.name || 'Рыбак',
        telegramUsername: updates.telegramUsername || '',
        experienceLevel: updates.experienceLevel || 'Любитель',
        fishingStyles: updates.fishingStyles || ['Зимняя со льда'],
        boatType: updates.boatType || 'Без техники',
        homeDistrict: updates.homeDistrict || 'Архангельск',
        bio: updates.bio || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      this.users.push(newUser);
      return newUser;
    }
    this.users[idx] = { ...this.users[idx], ...updates };
    return this.users[idx];
  }

  getSpots(): FishingSpot[] {
    return this.spots;
  }

  addSpot(spot: Omit<FishingSpot, 'id' | 'timestamp'>): FishingSpot {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newSpot: FishingSpot = {
      ...spot,
      id: `spot-${Date.now()}`,
      timestamp: timeStr
    };
    this.spots.unshift(newSpot);
    return newSpot;
  }

  getTrips(): PlannedTrip[] {
    return this.plannedTrips;
  }

  getTripById(id: string): PlannedTrip | undefined {
    return this.plannedTrips.find(t => t.id === id);
  }

  createTrip(trip: Omit<PlannedTrip, 'id' | 'createdAt' | 'participants'>, creator: UserProfile): PlannedTrip {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newTrip: PlannedTrip = {
      ...trip,
      id: `trip-${Date.now()}`,
      organizerId: creator.id,
      organizerName: creator.name,
      createdAt: timeStr,
      participants: [
        {
          userId: creator.id,
          userName: creator.name,
          telegramUsername: creator.telegramUsername,
          role: 'Организатор',
          joinedAt: timeStr
        }
      ]
    };
    this.plannedTrips.unshift(newTrip);
    return newTrip;
  }

  joinTrip(tripId: string, user: UserProfile): { success: boolean; message: string; trip?: PlannedTrip } {
    const trip = this.plannedTrips.find(t => t.id === tripId);
    if (!trip) return { success: false, message: 'Выезд не найден' };

    if (trip.participants.some(p => p.userId === user.id)) {
      return { success: false, message: 'Вы уже записаны в экипаж этого выезда', trip };
    }

    if (trip.participants.length >= trip.maxCrew) {
      return { success: false, message: 'Экипаж уже полностью укомплектован', trip };
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    trip.participants.push({
      userId: user.id,
      userName: user.name,
      telegramUsername: user.telegramUsername,
      role: 'Участник',
      joinedAt: timeStr
    });

    if (trip.participants.length >= trip.maxCrew) {
      trip.status = 'Экипаж набран';
    }

    return { success: true, message: `Вы успешно вошли в экипаж "${trip.title}"!`, trip };
  }

  leaveTrip(tripId: string, userId: string): { success: boolean; message: string; trip?: PlannedTrip } {
    const trip = this.plannedTrips.find(t => t.id === tripId);
    if (!trip) return { success: false, message: 'Выезд не найден' };

    const participant = trip.participants.find(p => p.userId === userId);
    if (!participant) return { success: false, message: 'Вы не состоите в этом экипаже', trip };

    if (participant.role === 'Организатор') {
      return { success: false, message: 'Организатор не может покинуть выезд', trip };
    }

    trip.participants = trip.participants.filter(p => p.userId !== userId);
    if (trip.status === 'Экипаж набран' && trip.participants.length < trip.maxCrew) {
      trip.status = 'Набор открыт';
    }

    return { success: true, message: 'Вы покинули экипаж', trip };
  }

  getHistory(): TripHistory[] {
    return this.history;
  }

  addHistory(entry: Omit<TripHistory, 'id' | 'createdAt'>): TripHistory {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
    const newEntry: TripHistory = {
      ...entry,
      id: `hist-${Date.now()}`,
      createdAt: dateStr
    };
    this.history.unshift(newEntry);
    return newEntry;
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  addLog(role: string, text: string, type: 'text' | 'location' | 'vote' | 'system' = 'text'): LogEntry {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      role,
      text,
      type
    };
    this.logs.unshift(newLog);
    return newLog;
  }

  getQueue(): SparkCommand[] {
    return this.queue;
  }
}

export const storage = new StorageService();
