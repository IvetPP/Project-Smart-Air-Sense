const db = require('../db/connection');
const { v4: uuidv4 } = require('uuid');

const now = new Date();

// Fetch the first device ID from the devices table
db.get('SELECT device_id FROM devices LIMIT 1', (err, row) => {
  if (err) {
    console.error('Database error:', err);
    db.close();
    return;
  }
  if (!row) {
    console.error('No devices found in DB. Please run initDb.js first.');
    db.close();
    return;
  }

  const deviceId = row.device_id;

  for (let i = 0; i < 10; i++) {
    const ts = new Date(now.getTime() - i * 60000).toISOString(); // 1-min intervals
    const metrics = {
      co2: 400 + Math.floor(Math.random() * 300),
      temperature: 20 + Math.random() * 5,
      humidity: 40 + Math.random() * 10,
    };

    db.run(
      'INSERT INTO measurements(device_id, timestamp, seq, metrics) VALUES (?, ?, ?, ?)',
      [deviceId, ts, i + 1, JSON.stringify(metrics)],
      (err) => {
        if (err) console.error('Error inserting measurement:', err);
      }
    );
  }

  console.log('Inserted 10 test measurements for device:', deviceId);
  db.close();
});