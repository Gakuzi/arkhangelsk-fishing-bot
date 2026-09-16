import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = "fishing_bot.db"

def get_connection():
    return sqlite3.connect(DB_FILE)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Users
    cursor.execute("""
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
            total_seats INTEGER DEFAULT 4,
            available_seats INTEGER DEFAULT 3,
            fuel_type TEXT DEFAULT 'АИ-92',
            fuel_price REAL DEFAULT 56.5,
            fuel_consumption REAL DEFAULT 9.5,
            tank_capacity REAL DEFAULT 55.0,
            created_at TEXT
        )
    """)

    # Try migrations for existing tables
    for col, col_type in [
        ("transport_name", "TEXT"),
        ("total_seats", "INTEGER DEFAULT 4"),
        ("available_seats", "INTEGER DEFAULT 3"),
        ("fuel_type", "TEXT DEFAULT 'АИ-92'"),
        ("fuel_price", "REAL DEFAULT 56.5"),
        ("fuel_consumption", "REAL DEFAULT 9.5"),
        ("tank_capacity", "REAL DEFAULT 55.0"),
    ]:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # Spots
    cursor.execute("""
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
    """)

    # Trips
    cursor.execute("""
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
            created_at TEXT
        )
    """)

    # History (Catches)
    cursor.execute("""
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
    """)

    # Logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT,
            user_name TEXT,
            text TEXT,
            log_type TEXT,
            timestamp TEXT
        )
    """)

    conn.commit()
    conn.close()

# --- Logging ---
def add_log(user_name: str, text: str, log_type: str = "text", role: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%d.%m %H:%M")
    cursor.execute(
        "INSERT INTO logs (role, user_name, text, log_type, timestamp) VALUES (?, ?, ?, ?, ?)",
        (role or user_name, user_name, text, log_type, now_str)
    )
    conn.commit()
    conn.close()

# --- Spots ---
def add_spot(name: str, lat: float, lon: float, area: str, added_by: str, description: str = "", depth_meters: str = "") -> str:
    spot_id = f"spot-{uuid.uuid4().hex[:8]}"
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%d.%m %H:%M")
    cursor.execute(
        "INSERT INTO spots (id, name, lat, lon, area, recommended_fish, season, description, depth_meters, added_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            spot_id,
            name,
            lat,
            lon,
            area,
            json.dumps(["Навага", "Корюшка", "Окунь"]),
            "Круглый год",
            description,
            depth_meters,
            added_by,
            now_str
        )
    )
    conn.commit()
    conn.close()
    return spot_id

def get_spots() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, lat, lon, area, description, added_by, depth_meters, season, created_at FROM spots ORDER BY rowid DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "name": r[1],
            "lat": r[2],
            "lon": r[3],
            "area": r[4],
            "description": r[5],
            "added_by": r[6],
            "depth_meters": r[7],
            "season": r[8],
            "created_at": r[9]
        }
        for r in rows
    ]

# --- Trips ---
def get_trips() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, organizer_id, organizer_name, title, destination, lat, lon, target_fish, date, meet_time, meet_place, transport_type, max_crew, status, checklist, notes, participants, created_at
        FROM trips
        ORDER BY date ASC, meet_time ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        try:
            parts = json.loads(r[16]) if r[16] else []
        except Exception:
            parts = []
        try:
            target_fish = json.loads(r[7]) if r[7] else []
        except Exception:
            target_fish = []
        result.append({
            "id": r[0],
            "organizer_id": r[1],
            "organizer_name": r[2],
            "title": r[3],
            "destination": r[4],
            "lat": r[5],
            "lon": r[6],
            "target_fish": target_fish,
            "date": r[8],
            "meet_time": r[9],
            "meet_place": r[10],
            "transport_type": r[11],
            "max_crew": r[12],
            "status": r[13],
            "participants": parts,
            "created_at": r[17]
        })
    return result

def get_trip_by_id(trip_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, organizer_id, organizer_name, title, destination, lat, lon, target_fish, date, meet_time, meet_place, transport_type, max_crew, status, checklist, notes, participants, created_at FROM trips WHERE id = ?", (trip_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    try:
        parts = json.loads(r[16]) if r[16] else []
    except Exception:
        parts = []
    return {
        "id": r[0],
        "organizer_id": r[1],
        "organizer_name": r[2],
        "title": r[3],
        "destination": r[4],
        "lat": r[5],
        "lon": r[6],
        "target_fish": json.loads(r[7]) if r[7] else [],
        "date": r[8],
        "meet_time": r[9],
        "meet_place": r[10],
        "transport_type": r[11],
        "max_crew": r[12],
        "status": r[13],
        "participants": parts,
        "created_at": r[17]
    }

def join_trip_db(trip_id: str, user_id: str, user_name: str, telegram_username: str) -> Dict[str, Any]:
    trip = get_trip_by_id(trip_id)
    if not trip:
        return {"success": False, "message": "Рыбалка не найдена"}
    
    parts = trip["participants"]
    if any(p.get("userId") == user_id for p in parts):
        return {"success": False, "message": "Вы уже в экипаже этой рыбалки!"}
    
    if len(parts) >= trip["max_crew"]:
        return {"success": False, "message": "В экипаже уже нет свободных мест!"}

    now_str = datetime.now().strftime("%d.%m %H:%M")
    parts.append({
        "userId": user_id,
        "userName": user_name,
        "telegramUsername": telegram_username,
        "role": "Участник",
        "joinedAt": now_str
    })

    new_status = "Экипаж набран" if len(parts) >= trip["max_crew"] else trip["status"]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE trips SET participants = ?, status = ? WHERE id = ?", (json.dumps(parts), new_status, trip_id))
    conn.commit()
    conn.close()

    add_log(user_name, f"Записался в экипаж: {trip['title']}", log_type="vote")
    return {"success": True, "message": f"Вы записаны в экипаж «{trip['title']}»!", "trip": trip}

def leave_trip_db(trip_id: str, user_id: str) -> Dict[str, Any]:
    trip = get_trip_by_id(trip_id)
    if not trip:
        return {"success": False, "message": "Рыбалка не найдена"}
    
    parts = trip["participants"]
    part = next((p for p in parts if p.get("userId") == user_id), None)
    if not part:
        return {"success": False, "message": "Вы не состоите в этом экипаже"}
    
    if part.get("role") == "Организатор":
        return {"success": False, "message": "Организатор не может покинуть свой выезд"}

    parts = [p for p in parts if p.get("userId") != user_id]
    new_status = "Набор открыт" if trip["status"] == "Экипаж набран" and len(parts) < trip["max_crew"] else trip["status"]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE trips SET participants = ?, status = ? WHERE id = ?", (json.dumps(parts), new_status, trip_id))
    conn.commit()
    conn.close()

    add_log(part.get("userName", "Рыбак"), f"Покинул экипаж: {trip['title']}", log_type="vote")
    return {"success": True, "message": f"Вы вышли из экипажа «{trip['title']}»"}

# --- Users ---
def upsert_user(user_id: str, name: str, username: str = "", phone: str = ""):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    exists = cursor.fetchone()
    if not exists:
        cursor.execute(
            """INSERT INTO users (id, name, telegram_username, phone, experience_level, boat_type, home_district, bio, fishing_styles, created_at)
               VALUES (?, ?, ?, ?, 'Любитель', 'Без техники', 'Архангельск', '', '["Зимняя со льда"]', ?)""",
            (user_id, name, username, phone, datetime.now().isoformat())
        )
    else:
        cursor.execute("UPDATE users SET name = ?, telegram_username = ? WHERE id = ?", (name, username, user_id))
    conn.commit()
    conn.close()

# --- Users & Car Settings ---
def get_user_by_tg(user_id: str, username: str = "") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, telegram_username, boat_type, transport_name, total_seats, available_seats, fuel_type, fuel_price, fuel_consumption, tank_capacity FROM users WHERE id = ? OR (telegram_username != '' AND telegram_username = ?)", (str(user_id), username))
    r = cursor.fetchone()
    conn.close()
    if r:
        return {
            "id": r[0],
            "name": r[1],
            "telegram_username": r[2],
            "boat_type": r[3] or "Без техники",
            "transport_name": r[4] or "Нива 4x4 / УАЗ",
            "total_seats": r[5] or 4,
            "available_seats": r[6] if r[6] is not None else 3,
            "fuel_type": r[7] or "АИ-92",
            "fuel_price": r[8] or 56.5,
            "fuel_consumption": r[9] or 10.5,
            "tank_capacity": r[10] or 50.0
        }
    # Return default car settings if user not found yet
    return {
        "id": str(user_id),
        "name": username or "Поморский Рыбак",
        "telegram_username": username,
        "boat_type": "УАЗ / Снегоход",
        "transport_name": "Нива 4x4 / УАЗ Патриот",
        "total_seats": 4,
        "available_seats": 3,
        "fuel_type": "АИ-92",
        "fuel_price": 56.5,
        "fuel_consumption": 10.5,
        "tank_capacity": 55.0
    }

def update_user_car(user_id: str, transport_name: str, fuel_type: str, fuel_consumption: float, fuel_price: float, total_seats: int, available_seats: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE id = ?", (str(user_id),))
    if not cursor.fetchone():
        cursor.execute(
            """INSERT INTO users (id, name, transport_name, fuel_type, fuel_consumption, fuel_price, total_seats, available_seats, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (str(user_id), f"Рыбак {user_id}", transport_name, fuel_type, fuel_consumption, fuel_price, total_seats, available_seats, datetime.now().isoformat())
        )
    else:
        cursor.execute(
            """UPDATE users SET transport_name = ?, fuel_type = ?, fuel_consumption = ?, fuel_price = ?, total_seats = ?, available_seats = ?
               WHERE id = ?""",
            (transport_name, fuel_type, fuel_consumption, fuel_price, total_seats, available_seats, str(user_id))
        )
    conn.commit()
    conn.close()

# Initialize tables
init_db()

