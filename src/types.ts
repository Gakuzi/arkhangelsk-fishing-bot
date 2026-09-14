export interface LogEntry {
  id: string;
  timestamp: string;
  role: string;
  text: string;
  type?: 'text' | 'location' | 'vote' | 'system';
}

export interface FishingSpot {
  id: string;
  user: string;
  lat: number;
  lon: number;
  name?: string;
  timestamp: string;
  areaDescription?: string;
}

export interface CrewMember {
  id: string;
  user: string;
  vote: 'yes' | 'no';
  timestamp: string;
  notes?: string;
}

export interface SparkCommand {
  id: string;
  method: string;
  payload: Record<string, any>;
  createdAt: string;
  status: 'pending' | 'delivered';
}

export interface BotConfig {
  hasToken: boolean;
  tokenMasked: string;
  chatId: string;
  botUsername: string;
  isRunning: boolean;
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
