const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

db.serialize(() => {
  console.log('Dropping existing tables...');
  db.run('DROP TABLE IF EXISTS users');
  db.run('DROP TABLE IF EXISTS devices');
  db.run('DROP TABLE IF EXISTS measurements');
  db.run('DROP TABLE IF EXISTS thresholds');
  db.run('DROP TABLE IF EXISTS alerts');

  console.log('Creating tables...');
  db.run(`CREATE TABLE users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      full_name TEXT,
      roles TEXT,
      created_at TEXT
  )`);

  db.run(`CREATE TABLE devices (
      device_id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      location TEXT,
      metadata TEXT,
      status TEXT,
      last_seen TEXT,
      created_at TEXT
  )`);

  db.run(`CREATE TABLE measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      timestamp TEXT,
      seq INTEGER,
      metrics TEXT
  )`);

  db.run(`CREATE TABLE thresholds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope TEXT,
      device_id TEXT,
      thresholds TEXT,
      updated_at TEXT
  )`);

  db.run(`CREATE TABLE alerts (
      alert_id TEXT PRIMARY KEY,
      device_id TEXT,
      metric TEXT,
      value REAL,
      threshold TEXT,
      severity TEXT,
      status TEXT,
      created_at TEXT,
      resolved_at TEXT
  )`);

  const adminId = uuidv4();
  const hash = bcrypt.hashSync('Test@1234', 10);

  db.run(`INSERT INTO users(user_id,email,password_hash,full_name,roles,created_at)
          VALUES(?,?,?,?,?,datetime('now'))`,
          [adminId, 'admin@example.com', hash, 'Admin User', 'admin']);

  console.log('Seeded admin user: admin@example.com / password: Test@1234');

  const deviceId = uuidv4();
  db.run(`INSERT INTO devices(device_id,name,type,location,metadata,status,last_seen,created_at)
          VALUES(?,?,?,?,?,?,datetime('now'),datetime('now'))`,
          [deviceId, 'Sensor A', 'CO2', 'Lab A', JSON.stringify({model:'X100'}), 'ON']);
  
  console.log('Seeded device:', deviceId);

  db.close();
  console.log('Database initialization complete.');
});
