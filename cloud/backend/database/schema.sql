CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  roles TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  location TEXT,
  status TEXT,
  owner_id TEXT,
  metadata TEXT,
  created_at TEXT,
  last_seen TEXT
);

CREATE TABLE IF NOT EXISTS measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  type TEXT,
  value REAL,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT,
  device_id TEXT,
  thresholds TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  type TEXT,
  value REAL,
  threshold REAL,
  created_at TEXT,
  resolved_at TEXT
);