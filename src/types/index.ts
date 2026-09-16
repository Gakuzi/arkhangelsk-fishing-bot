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
  // Transport & Fuel settings for route calculation & cost sharing
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
  rating: number; // 1 to 5
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
  // Passenger vs Driver flexibility
  tripType?: 'driver' | 'passenger';
  hasCar?: boolean;
  passengerSeatsNeeded?: number;
  // Fuel sharing & routes
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
  season: 'Круглый год' | 'Зима (со льда)' | 'Лето / Открытая вода';
  description: string;
  depthMeters?: string;
  addedBy: string;
  timestamp: string;
  user?: string;
  areaDescription?: string;
}

export interface BotConfig {
  telegramChatId: string;
  chatId?: string;
  botUsername: string;
  appUrl: string;
  hasToken: boolean;
  tokenMasked: string;
}

export interface CrewMember {
  id?: string;
  user: string;
  vote: 'yes' | 'no' | 'pending';
  lastSeen?: string;
  timestamp?: string;
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

export interface BotStatus {
  hasToken: boolean;
  tokenMasked: string;
  chatId: string;
  botUsername: string;
  isPolling: boolean;
  appUrl: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  author: string;
  text: string;
  time: string;
  location?: { lat: number; lon: number };
  reactions?: string[];
  buttons?: { text: string; callback_data?: string; url?: string }[];
}
