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

class StorageService {
  private users: UserProfile[] = [
    {
      id: 'u-1',
      name: 'Евгений Климов',
      telegramUsername: 'Gakuzi',
      phone: '+7 (911) 554-12-34',
      experienceLevel: 'Бывалый помор',
      fishingStyles: ['Зимняя со льда', 'Мормышка', 'Ловля на балансир', 'Троллинг'],
      boatType: 'Снегоход',
      homeDistrict: 'Архангельск (Октябрьский р-н)',
      bio: 'Ловлю навагу, корюшку и сига в дельте Двины и на Сухом море более 15 лет.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-01-10'
    },
    {
      id: 'u-2',
      name: 'Алексей Смирнов',
      telegramUsername: 'alex_pomor',
      phone: '+7 (921) 472-88-90',
      experienceLevel: 'Опытный',
      fishingStyles: ['Зимняя блесна', 'Джиг', 'Фидер'],
      boatType: 'Мотособака / Буксировщик',
      homeDistrict: 'Северодвинск (Ягры)',
      bio: 'Любитель морской рыбалки в Никольском рукаве и на Яграх.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-02-14'
    },
    {
      id: 'u-3',
      name: 'Михаил Попов',
      telegramUsername: 'mikhail_arkh',
      phone: '+7 (953) 931-20-45',
      experienceLevel: 'Любитель',
      fishingStyles: ['Поплавочная удочка', 'Спиннинг'],
      boatType: 'Лодка ПВХ с мотором',
      homeDistrict: 'Новодвинск',
      bio: 'Выезжаю по выходным за щукой и окунем.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-03-01'
    }
  ];

  private spots: FishingSpot[] = [
    {
      id: 'spot-1',
      name: 'Остров Мудьюг (Сухое Море)',
      lat: 64.8564,
      lon: 40.2812,
      area: 'Белое Море / Приморский р-н',
      recommendedFish: ['Навага', 'Корюшка-зубатка', 'Сиг'],
      season: 'Зима (со льда)',
      description: 'Знаменитое место зимнего лова. Глубины 4-7 метров, сильные приливно-отливные течения. Лучше брать светящиеся мормышки и креветку.',
      depthMeters: '4.5 - 7.0 м',
      addedBy: 'Евгений Климов',
      timestamp: '14.09 08:15'
    },
    {
      id: 'spot-2',
      name: 'Маймаксанский рукав (26-29 лесозаводы)',
      lat: 64.5381,
      lon: 40.5234,
      area: 'Северная Двина / Маймакса',
      recommendedFish: ['Окунь', 'Щука', 'Язь', 'Лещ'],
      season: 'Круглый год',
      description: 'Бровка вдоль фарватера и заливы. Отличная охота за хищником на балансиры зимой и джиг летом.',
      depthMeters: '3.0 - 6.0 м',
      addedBy: 'Алексей Смирнов',
      timestamp: '14.09 10:45'
    },
    {
      id: 'spot-3',
      name: 'Остров Ягры (Северодвинская губа)',
      lat: 64.6012,
      lon: 39.8450,
      area: 'Двинской залив Белого моря',
      recommendedFish: ['Камбала-полярка', 'Навага', 'Сиг'],
      season: 'Круглый год',
      description: 'Песчаные отмели и косы. Ловля камбалы на донки при отливе и по первому льду.',
      depthMeters: '2.0 - 4.5 м',
      addedBy: 'Алексей Смирнов',
      timestamp: '13.09 16:20'
    },
    {
      id: 'spot-4',
      name: 'Никольское устье (дельта Двины)',
      lat: 64.5520,
      lon: 40.2100,
      area: 'Дельта Северной Двины',
      recommendedFish: ['Судак', 'Лещ', 'Плотва', 'Окунь'],
      season: 'Круглый год',
      description: 'Глубокие ямы на стыке островов дельты. Требуются тяжелые грузила из-за течения.',
      depthMeters: '6.0 - 11.0 м',
      addedBy: 'Михаил Попов',
      timestamp: '12.09 14:00'
    }
  ];

  private plannedTrips: PlannedTrip[] = [
    {
      id: 'trip-1',
      organizerId: 'u-1',
      organizerName: 'Евгений Климов',
      title: 'Зимний рейд на Сухое Море за корюшкой и навагой',
      destination: 'Остров Мудьюг / Сухое Море',
      coordinates: { lat: 64.8564, lon: 40.2812 },
      targetFish: ['Корюшка', 'Навага', 'Сиг'],
      date: '2026-09-19',
      meetTime: '05:30',
      meetPlace: 'Причал в пос. Лапоминка (старт на снегоходах)',
      transportType: 'Снегоход Буран + сани (есть 2 места)',
      maxCrew: 4,
      participants: [
        {
          userId: 'u-1',
          userName: 'Евгений Климов',
          telegramUsername: 'Gakuzi',
          role: 'Организатор',
          joinedAt: '14.09 09:00'
        },
        {
          userId: 'u-2',
          userName: 'Алексей Смирнов',
          telegramUsername: 'alex_pomor',
          role: 'Участник',
          joinedAt: '14.09 09:30'
        }
      ],
      checklist: [
        'Удочки-кобылки с фосфорными мормышками',
        'Насадка: свежая креветка, опарыш',
        'Пешня / ледобур 130-150мм',
        'Термос с горячим чаем и перекус',
        'Спасалки на шею (техника безопасности!)'
      ],
      status: 'Набор открыт',
      notes: 'Выезд по приливу, возвращение к 17:00. Присоединяйтесь в экипаж!',
      createdAt: '14.09 09:00'
    },
    {
      id: 'trip-2',
      organizerId: 'u-2',
      organizerName: 'Алексей Смирнов',
      title: 'Трофейный окунь и щука в Маймаксанском рукаве',
      destination: 'Маймаксанский рукав',
      coordinates: { lat: 64.5381, lon: 40.5234 },
      targetFish: ['Окунь', 'Щука'],
      date: '2026-09-20',
      meetTime: '06:00',
      meetPlace: 'Архангельск, набережная 26 л/з',
      transportType: 'Мотобуксировщик Помор',
      maxCrew: 3,
      participants: [
        {
          userId: 'u-2',
          userName: 'Алексей Смирнов',
          telegramUsername: 'alex_pomor',
          role: 'Организатор',
          joinedAt: '14.09 10:00'
        },
        {
          userId: 'u-3',
          userName: 'Михаил Попов',
          telegramUsername: 'mikhail_arkh',
          role: 'Участник',
          joinedAt: '14.09 11:15'
        }
      ],
      checklist: [
        'Балансиры Rapala 5-7см расцветка CLN и окуневая',
        'Зимний эхолот Практик 6/8',
        'Поводки флюорокарбон 0.35мм'
      ],
      status: 'Набор открыт',
      notes: 'Ищем активного окуня по свалам.',
      createdAt: '14.09 10:00'
    }
  ];

  private history: TripHistory[] = [
    {
      id: 'hist-1',
      userId: 'u-1',
      authorName: 'Евгений Климов',
      date: '10.09.2026',
      location: 'Остров Мудьюг, Сухое Море',
      coordinates: { lat: 64.8564, lon: 40.2812 },
      weather: 'Пасмурно, -4°C, ветер ЮЗ 3 м/с, давление 754 мм рт. ст.',
      durationHours: 7,
      catches: [
        { species: 'Корюшка-зубатка', weightKg: 3.4, count: 62 },
        { species: 'Навага беломорская', weightKg: 4.8, count: 35, isTrophy: true },
        { species: 'Сиг проходной', weightKg: 0.9, count: 1, isTrophy: true }
      ],
      gearUsed: ['Зимняя удилка Higashi', 'Леска Owner Broad 0.16', 'Фосфорные капельки'],
      baitUsed: ['Варено-мороженая креветка', 'Опарыш белый'],
      review: 'Шикарный клев начался со сменой прилива около 11:30. Навага крупная, брала в 30 см ото дна. Сиг влетел неожиданно на стоячку с пучком опарыша.',
      rating: 5,
      depthMeters: 5.5,
      createdAt: '11.09.2026'
    },
    {
      id: 'hist-2',
      userId: 'u-2',
      authorName: 'Алексей Смирнов',
      date: '06.09.2026',
      location: 'Остров Ягры (Северодвинская губа)',
      coordinates: { lat: 64.6012, lon: 39.8450 },
      weather: 'Ясно, +6°C, ветер СВ 5 м/с',
      durationHours: 5,
      catches: [
        { species: 'Камбала полярная', weightKg: 2.1, count: 14 },
        { species: 'Навага', weightKg: 1.2, count: 9 }
      ],
      gearUsed: ['Морской фидер 3.9м', 'Шнур PE 1.2', 'Двухкрючковый монтаж с грузом-ложкой'],
      baitUsed: ['Морской червь (пескожил)', 'Резка сельди'],
      review: 'Ловили на отливе. Попадалась неплохая камбала-звездочка. Ветер к полудню усилился, пришлось собираться.',
      rating: 4,
      depthMeters: 3.0,
      createdAt: '07.09.2026'
    }
  ];

  private logs: LogEntry[] = [
    {
      id: 'log-1',
      timestamp: '14.09 07:30',
      role: 'Алексей',
      text: 'На Сухом море в районе о. Мудьюг с утра корюшка и навага берут активно!',
      type: 'text'
    },
    {
      id: 'log-2',
      timestamp: '14.09 08:15',
      role: 'Михаил',
      text: '📍 Прислал точку на карте: 64.8564, 40.2812',
      type: 'location'
    },
    {
      id: 'log-3',
      timestamp: '14.09 09:00',
      role: 'ГОЛОСОВАНИЕ',
      text: 'Евгений Климов открыл набор в экипаж на Мудьюг',
      type: 'vote'
    }
  ];

  private queue: SparkCommand[] = [
    {
      id: 'q-1',
      method: 'sendMessage',
      payload: {
        chat_id: '-1004386693265',
        text: '🎣 Внимание экипажу! Сбор в субботу в 05:30 на причале.',
        parse_mode: 'HTML'
      },
      createdAt: '14.09 11:00',
      status: 'delivered'
    }
  ];

  // Users
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
        telegramUsername: updates.telegramUsername || 'user',
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

  // Spots
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
    this.addLog(newSpot.addedBy, `📍 Добавил новую точку лова: ${newSpot.name} (${newSpot.lat}, ${newSpot.lon})`, 'location');
    return newSpot;
  }

  // Planned Trips
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
    this.addLog('ГОЛОСОВАНИЕ', `${creator.name} запланировал выезд: "${newTrip.title}" (${newTrip.destination})`, 'vote');
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

    this.addLog('ГОЛОСОВАНИЕ', `🔥 ${user.name} записался в экипаж: "${trip.title}"`, 'vote');
    return { success: true, message: `Вы успешно вошли в экипаж "${trip.title}"!`, trip };
  }

  leaveTrip(tripId: string, userId: string): { success: boolean; message: string; trip?: PlannedTrip } {
    const trip = this.plannedTrips.find(t => t.id === tripId);
    if (!trip) return { success: false, message: 'Выезд не найден' };

    const participant = trip.participants.find(p => p.userId === userId);
    if (!participant) return { success: false, message: 'Вы не состоите в этом экипаже', trip };

    if (participant.role === 'Организатор') {
      return { success: false, message: 'Организатор не может покинуть выезд. Вы можете отменить его.', trip };
    }

    trip.participants = trip.participants.filter(p => p.userId !== userId);
    if (trip.status === 'Экипаж набран' && trip.participants.length < trip.maxCrew) {
      trip.status = 'Набор открыт';
    }

    this.addLog('ГОЛОСОВАНИЕ', `🫡 ${participant.userName} покинул экипаж выезда "${trip.title}"`, 'vote');
    return { success: true, message: 'Вы покинули экипаж', trip };
  }

  // History
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
    this.addLog(newEntry.authorName, `🐟 Опубликовал отчет о рыбалке: ${newEntry.location} (оценка ${newEntry.rating}/5)`, 'text');
    return newEntry;
  }

  // Logs
  getLogs(): LogEntry[] {
    return this.logs;
  }

  addLog(role: string, text: string, type: 'text' | 'location' | 'vote' | 'system' = 'text'): LogEntry {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      role,
      text,
      type
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 200) this.logs.pop();
    return newLog;
  }

  // Queue
  getQueue(): SparkCommand[] {
    return this.queue;
  }

  addQueueCommand(method: string, payload: Record<string, any>): SparkCommand {
    const cmd: SparkCommand = {
      id: `q-${Date.now()}`,
      method,
      payload,
      createdAt: new Date().toLocaleTimeString('ru-RU'),
      status: 'pending'
    };
    this.queue.unshift(cmd);
    return cmd;
  }
}

export const storage = new StorageService();
