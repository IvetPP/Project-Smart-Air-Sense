const sqlite3 = require('sqlite3').verbose(); // ✅ Add this line
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/database.db'); // optional: absolute path
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Optional: create tables automatically if not exists
db.exec(`
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
`);

module.exports = db;
