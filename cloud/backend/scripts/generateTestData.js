const db = require('../db/connection');
const { v4: uuidv4 } = require('uuid');

const now = new Date();
const deviceId = 'replace_with_device_id';

for(let i=0;i<10;i++){
  const ts = new Date(now.getTime() - i*60000).toISOString();
  const metrics = { co2: 400+Math.floor(Math.random()*300), temperature: 20+Math.random()*5, humidity: 40+Math.random()*10 };
  db.run('INSERT INTO measurements(device_id,timestamp,seq,metrics) VALUES(?,?,?,?)',
        [deviceId, ts, i+1, JSON.stringify(metrics)]);
}
console.log('Inserted 10 test measurements');
db.close();
