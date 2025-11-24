const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

db.serialize(() => {
  console.log('Dropping existing tables...');
  // Drop tables in reverse dependency order to avoid foreign key errors
  db.run('DROP TABLE IF EXISTS user_tokens');
  db.run('DROP TABLE IF EXISTS user_devices');
  db.run('DROP TABLE IF EXISTS alerts');
  db.run('DROP TABLE IF EXISTS measurements');
  db.run('DROP TABLE IF EXISTS thresholds');
  db.run('DROP TABLE IF EXISTS devices');
  db.run('DROP TABLE IF EXISTS gateways');
  db.run('DROP TABLE IF EXISTS users');
  db.run('DROP TABLE IF EXISTS system_status');

  console.log('Creating tables with Foreign Keys...');

  // USERS table
  db.run(`
    CREATE TABLE users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      roles TEXT NOT NULL DEFAULT 'ROLE_LOGGED_USER',
      created_at TEXT NOT NULL
    )
  `);

  // GATEWAYS table
  db.run(`
    CREATE TABLE gateways (
      gateway_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      last_seen TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // DEVICES table
  db.run(`
    CREATE TABLE devices (
      device_id TEXT PRIMARY KEY,
      owner_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      type TEXT,
      location TEXT,
      metadata TEXT,
      status TEXT,
      last_seen TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // USER_DEVICES (RBAC)
  db.run(`
    CREATE TABLE user_devices (
      user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, device_id)
    )
  `);

  // MEASUREMENTS table
  db.run(`
    CREATE TABLE measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT REFERENCES devices(device_id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      seq INTEGER,
      metrics TEXT NOT NULL
    )
  `);

  // THRESHOLDS table
  db.run(`
    CREATE TABLE thresholds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope TEXT,
      device_id TEXT REFERENCES devices(device_id) ON DELETE CASCADE,
      thresholds TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // ALERTS table
  db.run(`
    CREATE TABLE alerts (
      alert_id TEXT PRIMARY KEY,
      device_id TEXT REFERENCES devices(device_id) ON DELETE CASCADE,
      metric TEXT,
      value REAL,
      threshold TEXT,
      severity TEXT,
      status TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    )
  `);

  // SYSTEM_STATUS table
  db.run(`
    CREATE TABLE system_status (
      name TEXT PRIMARY KEY,
      status TEXT,
      version TEXT,
      updated_at TEXT
    )
  `);

  // USER_TOKENS table
  db.run(`
    CREATE TABLE user_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT,
      revoked BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  // --- SEEDING ---
  const adminId = uuidv4();
  const ADMIN_ROLE = 'ROLE_ADMIN';
  const hash = bcrypt.hashSync('Test@1234', 10);

  db.run(
    `INSERT INTO users(user_id, email, password_hash, full_name, roles, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [adminId, 'admin@example.com', hash, 'Admin User', ADMIN_ROLE]
  );

  console.log('Seeded admin user (ROLE_ADMIN): admin@example.com / password: Test@1234');

  const deviceId = uuidv4();

  db.run(
    `INSERT INTO devices(device_id, name, type, location, owner_id, metadata, status, last_seen, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      deviceId,
      'Sensor A',
      'CO2',
      'Lab A',
      adminId,
      JSON.stringify({ model: 'X100' }),
      'ON'
    ]
  );

  // Link device to user
  db.run(`INSERT INTO user_devices(user_id, device_id) VALUES (?, ?)`, [
    adminId,
    deviceId
  ]);

  console.log('Seeded device:', deviceId, 'owned by', adminId);

  db.close();
  console.log('Database initialization complete.');
});
