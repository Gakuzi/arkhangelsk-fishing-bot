// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { UserProfile, FishingSpot, PlannedTrip, TripHistory, LogEntry, SparkCommand, FishingGear } from './storage.ts';

const DB_FILE = path.join(process.cwd(), 'fishing_bot.db');

class SQLiteStorage {
  private db: any;

  constructor() {
    try {
      this.db = new DatabaseSync(DB_FILE);
      console.log('[SQLite] Connected to persistent SQLite database via node:sqlite:', DB_FILE);
      this.initTables();
    } catch (err) {
      console.error('[SQLite] Failed to connect to database:', err);
    }
  }

  private run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) {
          resolve();
          return;
        }
        const safeParams = params.map(v => v === undefined ? null : v);
        this.db.prepare(sql).run(...safeParams);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  private all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) {
          resolve([]);
          return;
        }
        const safeParams = params.map(v => v === undefined ? null : v);
        const rows = this.db.prepare(sql).all(...safeParams);
        resolve(rows as T[]);
      } catch (err) {
        reject(err);
      }
    });
  }

  private get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) {
          resolve(undefined);
          return;
        }
        const safeParams = params.map(v => v === undefined ? null : v);
        const row = this.db.prepare(sql).get(...safeParams);
        resolve(row as T);
      } catch (err) {
        reject(err);
      }
    });
  }

  private async initTables() {
    // Users
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        telegram_username TEXT,
        phone TEXT,
        experience_level TEXT DEFAULT 'Любитель',
        boat_type TEXT DEFAULT 'Без техники',
        home_district TEXT,
        bio TEXT,
        fishing_styles TEXT,
        avatar_url TEXT,
        transport_name TEXT,
        total_seats INTEGER,
        available_seats INTEGER,
        fuel_type TEXT,
        fuel_price REAL,
        fuel_consumption REAL,
        tank_capacity REAL,
        created_at TEXT
      )
    `);

    // Dynamic columns migration for existing users table
    const tryAddCol = async (table: string, col: string, type: string) => {
      try {
        await this.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
      } catch {}
    };

    await tryAddCol('users', 'transport_name', 'TEXT');
    await tryAddCol('users', 'total_seats', 'INTEGER');
    await tryAddCol('users', 'available_seats', 'INTEGER');
    await tryAddCol('users', 'fuel_type', 'TEXT');
    await tryAddCol('users', 'fuel_price', 'REAL');
    await tryAddCol('users', 'fuel_consumption', 'REAL');
    await tryAddCol('users', 'tank_capacity', 'REAL');

    // Gear (Personal fishing tackle)
    await this.run(`
      CREATE TABLE IF NOT EXISTS user_gear (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        notes TEXT,
        is_ready INTEGER DEFAULT 1,
        created_at TEXT
      )
    `);

    // Spots
    await this.run(`
      CREATE TABLE IF NOT EXISTS spots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        area TEXT,
        recommended_fish TEXT,
        season TEXT,
        description TEXT,
        depth_meters TEXT,
        added_by TEXT,
        created_at TEXT
      )
    `);

    // Trips
    await this.run(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        organizer_id TEXT,
        organizer_name TEXT,
        title TEXT NOT NULL,
        destination TEXT NOT NULL,
        lat REAL,
        lon REAL,
        target_fish TEXT,
        date TEXT NOT NULL,
        meet_time TEXT,
        meet_place TEXT,
        transport_type TEXT,
        max_crew INTEGER DEFAULT 4,
        status TEXT DEFAULT 'Набор открыт',
        checklist TEXT,
        notes TEXT,
        participants TEXT,
        distance_km REAL,
        fuel_cost_total REAL,
        cost_per_person REAL,
        fuel_type TEXT,
        created_at TEXT
      )
    `);

    await tryAddCol('trips', 'distance_km', 'REAL');
    await tryAddCol('trips', 'fuel_cost_total', 'REAL');
    await tryAddCol('trips', 'cost_per_person', 'REAL');
    await tryAddCol('trips', 'fuel_type', 'TEXT');

    // History (catch reports)
    await this.run(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        author_name TEXT,
        date TEXT,
        location TEXT,
        lat REAL,
        lon REAL,
        weather TEXT,
        duration_hours REAL,
        catches TEXT,
        gear_used TEXT,
        bait_used TEXT,
        review TEXT,
        rating INTEGER,
        depth_meters REAL,
        created_at TEXT
      )
    `);

    // Logs
    await this.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT,
        user_name TEXT,
        text TEXT,
        log_type TEXT,
        timestamp TEXT
      )
    `);
  }

  // --- Users ---
  async getUsers(): Promise<UserProfile[]> {
    const rows = await this.all<any>('SELECT * FROM users ORDER BY rowid ASC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      telegramUsername: r.telegram_username || '',
      phone: r.phone || '',
      experienceLevel: r.experience_level || 'Любитель',
      fishingStyles: r.fishing_styles ? JSON.parse(r.fishing_styles) : [],
      boatType: r.boat_type || 'Без техники',
      homeDistrict: r.home_district || 'Архангельск',
      bio: r.bio || '',
      avatarUrl: r.avatar_url || '',
      transportName: r.transport_name || '',
      totalSeats: r.total_seats != null ? Number(r.total_seats) : 4,
      availableSeats: r.available_seats != null ? Number(r.available_seats) : 2,
      fuelType: r.fuel_type || 'АИ-92',
      fuelPricePerLiter: r.fuel_price != null ? Number(r.fuel_price) : 58.0,
      fuelConsumptionPer100km: r.fuel_consumption != null ? Number(r.fuel_consumption) : 12.0,
      tankCapacityLiters: r.tank_capacity != null ? Number(r.tank_capacity) : 60,
      createdAt: r.created_at || ''
    }));
  }

  async getUserById(id: string): Promise<UserProfile | undefined> {
    const r = await this.get<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (!r) return undefined;
    return {
      id: r.id,
      name: r.name,
      telegramUsername: r.telegram_username || '',
      phone: r.phone || '',
      experienceLevel: r.experience_level || 'Любитель',
      fishingStyles: r.fishing_styles ? JSON.parse(r.fishing_styles) : [],
      boatType: r.boat_type || 'Без техники',
      homeDistrict: r.home_district || 'Архангельск',
      bio: r.bio || '',
      avatarUrl: r.avatar_url || '',
      transportName: r.transport_name || '',
      totalSeats: r.total_seats != null ? Number(r.total_seats) : 4,
      availableSeats: r.available_seats != null ? Number(r.available_seats) : 2,
      fuelType: r.fuel_type || 'АИ-92',
      fuelPricePerLiter: r.fuel_price != null ? Number(r.fuel_price) : 58.0,
      fuelConsumptionPer100km: r.fuel_consumption != null ? Number(r.fuel_consumption) : 12.0,
      tankCapacityLiters: r.tank_capacity != null ? Number(r.tank_capacity) : 60,
      createdAt: r.created_at || ''
    };
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getUserById(id);
    if (!existing) {
      const newUser: UserProfile = {
        id,
        name: updates.name || 'Рыбак',
        telegramUsername: updates.telegramUsername || '',
        phone: updates.phone || '',
        experienceLevel: updates.experienceLevel || 'Любитель',
        fishingStyles: updates.fishingStyles || ['Зимняя со льда'],
        boatType: updates.boatType || 'Без техники',
        homeDistrict: updates.homeDistrict || 'Архангельск',
        bio: updates.bio || '',
        avatarUrl: updates.avatarUrl || '',
        transportName: updates.transportName || '',
        totalSeats: updates.totalSeats != null ? Number(updates.totalSeats) : 4,
        availableSeats: updates.availableSeats != null ? Number(updates.availableSeats) : 2,
        fuelType: updates.fuelType || 'АИ-92',
        fuelPricePerLiter: updates.fuelPricePerLiter != null ? Number(updates.fuelPricePerLiter) : 58.0,
        fuelConsumptionPer100km: updates.fuelConsumptionPer100km != null ? Number(updates.fuelConsumptionPer100km) : 12.0,
        tankCapacityLiters: updates.tankCapacityLiters != null ? Number(updates.tankCapacityLiters) : 60,
        createdAt: new Date().toISOString().split('T')[0]
      };

      await this.run(
        `INSERT OR REPLACE INTO users (id, name, telegram_username, phone, experience_level, boat_type, home_district, bio, fishing_styles, avatar_url, transport_name, total_seats, available_seats, fuel_type, fuel_price, fuel_consumption, tank_capacity, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newUser.id,
          newUser.name,
          newUser.telegramUsername,
          newUser.phone,
          newUser.experienceLevel,
          newUser.boatType,
          newUser.homeDistrict,
          newUser.bio,
          JSON.stringify(newUser.fishingStyles),
          newUser.avatarUrl,
          newUser.transportName,
          newUser.totalSeats,
          newUser.availableSeats,
          newUser.fuelType,
          newUser.fuelPricePerLiter,
          newUser.fuelConsumptionPer100km,
          newUser.tankCapacityLiters,
          newUser.createdAt
        ]
      );
      return newUser;
    }

    const merged = { ...existing, ...updates };
    await this.run(
      `UPDATE users SET
        name = ?,
        telegram_username = ?,
        phone = ?,
        experience_level = ?,
        boat_type = ?,
        home_district = ?,
        bio = ?,
        fishing_styles = ?,
        avatar_url = ?,
        transport_name = ?,
        total_seats = ?,
        available_seats = ?,
        fuel_type = ?,
        fuel_price = ?,
        fuel_consumption = ?,
        tank_capacity = ?
      WHERE id = ?`,
      [
        merged.name,
        merged.telegramUsername,
        merged.phone,
        merged.experienceLevel,
        merged.boatType,
        merged.homeDistrict,
        merged.bio,
        JSON.stringify(merged.fishingStyles),
        merged.avatarUrl,
        merged.transportName || null,
        merged.totalSeats != null ? Number(merged.totalSeats) : null,
        merged.availableSeats != null ? Number(merged.availableSeats) : null,
        merged.fuelType || null,
        merged.fuelPricePerLiter != null ? Number(merged.fuelPricePerLiter) : null,
        merged.fuelConsumptionPer100km != null ? Number(merged.fuelConsumptionPer100km) : null,
        merged.tankCapacityLiters != null ? Number(merged.tankCapacityLiters) : null,
        id
      ]
    );
    return merged;
  }

  // --- Gear (Снасти) ---
  async getGear(userId: string): Promise<FishingGear[]> {
    const rows = await this.all<any>('SELECT * FROM user_gear WHERE user_id = ? ORDER BY rowid DESC', [userId]);
    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      category: r.category as any,
      quantity: r.quantity ? Number(r.quantity) : 1,
      notes: r.notes || '',
      isReady: Boolean(r.is_ready),
      createdAt: r.created_at || ''
    }));
  }

  async addGear(gear: Omit<FishingGear, 'id' | 'createdAt'>): Promise<FishingGear> {
    const id = `gear-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const createdAt = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    await this.run(
      `INSERT INTO user_gear (id, user_id, name, category, quantity, notes, is_ready, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        gear.userId,
        gear.name,
        gear.category,
        gear.quantity || 1,
        gear.notes || '',
        gear.isReady ? 1 : 0,
        createdAt
      ]
    );

    return {
      ...gear,
      id,
      createdAt
    };
  }

  async updateGear(id: string, updates: Partial<FishingGear>): Promise<FishingGear | undefined> {
    const existing = await this.get<any>('SELECT * FROM user_gear WHERE id = ?', [id]);
    if (!existing) return undefined;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const category = updates.category !== undefined ? updates.category : existing.category;
    const quantity = updates.quantity !== undefined ? updates.quantity : existing.quantity;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;
    const isReady = updates.isReady !== undefined ? (updates.isReady ? 1 : 0) : existing.is_ready;

    await this.run(
      `UPDATE user_gear SET name = ?, category = ?, quantity = ?, notes = ?, is_ready = ? WHERE id = ?`,
      [name, category, quantity, notes, isReady, id]
    );

    return {
      id,
      userId: existing.user_id,
      name,
      category,
      quantity,
      notes,
      isReady: Boolean(isReady),
      createdAt: existing.created_at
    };
  }

  async deleteGear(id: string): Promise<boolean> {
    await this.run('DELETE FROM user_gear WHERE id = ?', [id]);
    return true;
  }

  // --- Spots ---
  async getSpots(): Promise<FishingSpot[]> {
    const rows = await this.all<any>('SELECT * FROM spots ORDER BY rowid DESC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lon: r.lon,
      area: r.area || 'Архангельская обл.',
      recommendedFish: r.recommended_fish ? JSON.parse(r.recommended_fish) : ['Навага', 'Корюшка'],
      season: r.season || 'Круглый год',
      description: r.description || '',
      depthMeters: r.depth_meters || '',
      addedBy: r.added_by || 'Рыбак',
      timestamp: r.created_at || ''
    }));
  }

  async addSpot(spot: Omit<FishingSpot, 'id' | 'timestamp'>): Promise<FishingSpot> {
    const id = `spot-${Date.now()}`;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    await this.run(
      `INSERT INTO spots (id, name, lat, lon, area, recommended_fish, season, description, depth_meters, added_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        spot.name,
        spot.lat,
        spot.lon,
        spot.area || 'Дельта Северной Двины',
        JSON.stringify(spot.recommendedFish || []),
        spot.season || 'Круглый год',
        spot.description || '',
        spot.depthMeters || '',
        spot.addedBy || 'Рыбак',
        timeStr
      ]
    );

    const newSpot: FishingSpot = {
      ...spot,
      id,
      timestamp: timeStr
    };

    await this.addLog(newSpot.addedBy, `📍 Добавил точку: ${newSpot.name} (${newSpot.lat.toFixed(4)}, ${newSpot.lon.toFixed(4)})`, 'location');
    return newSpot;
  }

  // --- Trips ---
  async getTrips(): Promise<PlannedTrip[]> {
    const rows = await this.all<any>('SELECT * FROM trips ORDER BY date ASC, meet_time ASC');
    return rows.map(r => ({
      id: r.id,
      organizerId: r.organizer_id || '',
      organizerName: r.organizer_name || 'Организатор',
      title: r.title,
      destination: r.destination,
      coordinates: (r.lat && r.lon) ? { lat: r.lat, lon: r.lon } : undefined,
      targetFish: r.target_fish ? JSON.parse(r.target_fish) : [],
      date: r.date,
      meetTime: r.meet_time || '',
      meetPlace: r.meet_place || '',
      transportType: r.transport_type || 'Без техники',
      maxCrew: r.max_crew || 4,
      status: r.status || 'Набор открыт',
      checklist: r.checklist ? JSON.parse(r.checklist) : [],
      notes: r.notes || '',
      participants: r.participants ? JSON.parse(r.participants) : [],
      distanceKm: r.distance_km != null ? Number(r.distance_km) : undefined,
      fuelCostTotal: r.fuel_cost_total != null ? Number(r.fuel_cost_total) : undefined,
      costPerPerson: r.cost_per_person != null ? Number(r.cost_per_person) : undefined,
      fuelType: r.fuel_type || undefined,
      createdAt: r.created_at || ''
    }));
  }

  async getTripById(id: string): Promise<PlannedTrip | undefined> {
    const r = await this.get<any>('SELECT * FROM trips WHERE id = ?', [id]);
    if (!r) return undefined;
    return {
      id: r.id,
      organizerId: r.organizer_id || '',
      organizerName: r.organizer_name || 'Организатор',
      title: r.title,
      destination: r.destination,
      coordinates: (r.lat && r.lon) ? { lat: r.lat, lon: r.lon } : undefined,
      targetFish: r.target_fish ? JSON.parse(r.target_fish) : [],
      date: r.date,
      meetTime: r.meet_time || '',
      meetPlace: r.meet_place || '',
      transportType: r.transport_type || 'Без техники',
      maxCrew: r.max_crew || 4,
      status: r.status || 'Набор открыт',
      checklist: r.checklist ? JSON.parse(r.checklist) : [],
      notes: r.notes || '',
      participants: r.participants ? JSON.parse(r.participants) : [],
      distanceKm: r.distance_km != null ? Number(r.distance_km) : undefined,
      fuelCostTotal: r.fuel_cost_total != null ? Number(r.fuel_cost_total) : undefined,
      costPerPerson: r.cost_per_person != null ? Number(r.cost_per_person) : undefined,
      fuelType: r.fuel_type || undefined,
      createdAt: r.created_at || ''
    };
  }

  async createTrip(trip: Omit<PlannedTrip, 'id' | 'createdAt' | 'participants'>, creator: UserProfile): Promise<PlannedTrip> {
    const id = `trip-${Date.now()}`;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const participants = [
      {
        userId: creator.id,
        userName: creator.name,
        telegramUsername: creator.telegramUsername,
        role: 'Организатор' as const,
        joinedAt: timeStr
      }
    ];

    await this.run(
      `INSERT INTO trips (id, organizer_id, organizer_name, title, destination, lat, lon, target_fish, date, meet_time, meet_place, transport_type, max_crew, status, checklist, notes, participants, distance_km, fuel_cost_total, cost_per_person, fuel_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        creator.id,
        creator.name,
        trip.title,
        trip.destination,
        trip.coordinates?.lat || null,
        trip.coordinates?.lon || null,
        JSON.stringify(trip.targetFish || []),
        trip.date,
        trip.meetTime,
        trip.meetPlace,
        trip.transportType,
        trip.maxCrew,
        trip.status || 'Набор открыт',
        JSON.stringify(trip.checklist || []),
        trip.notes || '',
        JSON.stringify(participants),
        trip.distanceKm || null,
        trip.fuelCostTotal || null,
        trip.costPerPerson || null,
        trip.fuelType || null,
        timeStr
      ].map(v => v === undefined ? null : v)
    );

    const newTrip: PlannedTrip = {
      ...trip,
      id,
      organizerId: creator.id,
      organizerName: creator.name,
      participants,
      createdAt: timeStr
    };

    await this.addLog('ГОЛОСОВАНИЕ', `📅 Открыт набор в экипаж: "${newTrip.title}" (${newTrip.destination})`, 'vote');
    return newTrip;
  }

  async joinTrip(tripId: string, user: UserProfile): Promise<{ success: boolean; message: string; trip?: PlannedTrip }> {
    const trip = await this.getTripById(tripId);
    if (!trip) return { success: false, message: 'Выезд не найден' };

    if (trip.participants.some(p => p.userId === user.id)) {
      return { success: false, message: 'Вы уже в экипаже этого выезда', trip };
    }

    if (trip.participants.length >= trip.maxCrew) {
      return { success: false, message: 'В экипаже больше нет свободных мест', trip };
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

    await this.run(
      'UPDATE trips SET participants = ?, status = ? WHERE id = ?',
      [JSON.stringify(trip.participants), trip.status, tripId]
    );

    await this.addLog('ГОЛОСОВАНИЕ', `🔥 ${user.name} записался в экипаж: "${trip.title}"`, 'vote');
    return { success: true, message: `Вы успешно вошли в экипаж "${trip.title}"!`, trip };
  }

  async leaveTrip(tripId: string, userId: string): Promise<{ success: boolean; message: string; trip?: PlannedTrip }> {
    const trip = await this.getTripById(tripId);
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

    await this.run(
      'UPDATE trips SET participants = ?, status = ? WHERE id = ?',
      [JSON.stringify(trip.participants), trip.status, tripId]
    );

    await this.addLog('ГОЛОСОВАНИЕ', `🫡 ${participant.userName} покинул экипаж выезда "${trip.title}"`, 'vote');
    return { success: true, message: 'Вы покинули экипаж', trip };
  }

  // --- History ---
  async getHistory(): Promise<TripHistory[]> {
    const rows = await this.all<any>('SELECT * FROM history ORDER BY rowid DESC');
    return rows.map(r => ({
      id: r.id,
      userId: r.user_id || '',
      authorName: r.author_name || 'Рыбак',
      date: r.date || '',
      location: r.location || '',
      coordinates: (r.lat && r.lon) ? { lat: r.lat, lon: r.lon } : undefined,
      weather: r.weather || '',
      durationHours: r.duration_hours || 0,
      catches: r.catches ? JSON.parse(r.catches) : [],
      gearUsed: r.gear_used ? JSON.parse(r.gear_used) : [],
      baitUsed: r.bait_used ? JSON.parse(r.bait_used) : [],
      review: r.review || '',
      rating: r.rating || 5,
      depthMeters: r.depth_meters || undefined,
      createdAt: r.created_at || ''
    }));
  }

  async addHistory(entry: Omit<TripHistory, 'id' | 'createdAt'>): Promise<TripHistory> {
    const id = `hist-${Date.now()}`;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;

    await this.run(
      `INSERT INTO history (id, user_id, author_name, date, location, lat, lon, weather, duration_hours, catches, gear_used, bait_used, review, rating, depth_meters, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.userId,
        entry.authorName,
        entry.date,
        entry.location,
        entry.coordinates?.lat || null,
        entry.coordinates?.lon || null,
        entry.weather,
        entry.durationHours,
        JSON.stringify(entry.catches || []),
        JSON.stringify(entry.gearUsed || []),
        JSON.stringify(entry.baitUsed || []),
        entry.review,
        entry.rating,
        entry.depthMeters || null,
        dateStr
      ]
    );

    const newEntry: TripHistory = {
      ...entry,
      id,
      createdAt: dateStr
    };

    await this.addLog(newEntry.authorName, `🐟 Опубликовал отчет об улове: ${newEntry.location}`, 'text');
    return newEntry;
  }

  // --- Logs ---
  async getLogs(): Promise<LogEntry[]> {
    const rows = await this.all<any>('SELECT * FROM logs ORDER BY id DESC LIMIT 100');
    return rows.map(r => ({
      id: `log-${r.id}`,
      timestamp: r.timestamp || '',
      role: r.role || r.user_name || 'Рыбак',
      text: r.text || '',
      type: (r.log_type as any) || 'text'
    }));
  }

  async addLog(role: string, text: string, type: 'text' | 'location' | 'vote' | 'system' = 'text'): Promise<LogEntry> {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    await this.run(
      'INSERT INTO logs (role, user_name, text, log_type, timestamp) VALUES (?, ?, ?, ?, ?)',
      [role, role, text, type, timeStr]
    );

    return {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      role,
      text,
      type
    };
  }

  getQueue(): SparkCommand[] {
    return [];
  }
}

export const sqliteStorage = new SQLiteStorage();
