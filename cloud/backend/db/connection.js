const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbFolder = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const dbPath = path.join(dbFolder, 'data.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Failed to connect to DB:', err);
  else console.log('Connected to SQLite DB');
});

// ENABLE FOREIGN KEY CONSTRAINTS
db.run("PRAGMA foreign_keys = ON;"); 

module.exports = db;