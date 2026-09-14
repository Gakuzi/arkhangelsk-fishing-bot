import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = "fishing_bot.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
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
            fishing_styles TEXT
        )
    """)

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
            added_by TEXT,
            created_at TEXT
        )
    """)

    # Trips
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            destination TEXT NOT NULL,
            date TEXT NOT NULL,
            meet_time TEXT,
            meet_place TEXT,
            transport_type TEXT,
            max_crew INTEGER DEFAULT 4,
            status TEXT DEFAULT 'Набор открыт',
            organizer_name TEXT,
            participants TEXT
        )
    """)

    # Logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            text TEXT,
            log_type TEXT,
            timestamp TEXT
        )
    """)

    conn.commit()

    # Seed initial spots if empty
    cursor.execute("SELECT COUNT(*) FROM spots")
    if cursor.fetchone()[0] == 0:
        seed_spots = [
            ("spot-1", "Маяк Мудьюгский (Северная оконечность)", 64.8820, 40.2910, "Остров Мудьюг / Белое Море", '["Корюшка", "Навага"]', "Зима (со льда)", "Лов наваги и корюшки на перемене течений.", "Евгений", datetime.now().isoformat()),
            ("spot-2", "Сухое Море (район протоки Железница)", 64.7950, 40.3540, "Сухое Море", '["Навага беломорская", "Корюшка-зубатка"]', "Зима (со льда)", "Отличный клев наваги по малой воде.", "Михаил", datetime.now().isoformat()),
            ("spot-3", "Северодвинская губа (о. Ягры)", 64.6020, 39.8150, "Остров Ягры", '["Сиг", "Корюшка", "Камбала"]', "Круглый год", "Выход на лед у соснового бора.", "Алексей", datetime.now().isoformat())
        ]
        cursor.executemany(
            "INSERT INTO spots VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            seed_spots
        )
        conn.commit()

    conn.close()

def add_log(user_name: str, text: str, log_type: str = "text"):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO logs (user_name, text, log_type, timestamp) VALUES (?, ?, ?, ?)",
        (user_name, text, log_type, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def add_spot(name: str, lat: float, lon: float, area: str, added_by: str, description: str = "") -> str:
    import uuid
    spot_id = f"spot-{uuid.uuid4().hex[:8]}"
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO spots VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            spot_id,
            name,
            lat,
            lon,
            area,
            json.dumps(["Навага", "Корюшка", "Окунь"]),
            "Круглый год",
            description,
            added_by,
            datetime.now().isoformat()
        )
    )
    conn.commit()
    conn.close()
    return spot_id

def get_spots() -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, lat, lon, area, description, added_by FROM spots")
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
            "added_by": r[6]
        }
        for r in rows
    ]

# Initialize tables on import
init_db()
