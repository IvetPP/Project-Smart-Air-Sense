const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const db = require('../db/connection');

// GET measurements
router.get('/',
  authMiddleware,
  query('device_id').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidation,
  (req, res) => {
    const { device_id, limit } = req.query;
    const userId = req.user.sub;
    const isAdminOrOwner = req.user.roles.some(r =>
      ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(r)
    );

    let sql = 'SELECT m.* FROM measurements m';
    let params = [];
    let where = [];

    if (!isAdminOrOwner) {
      sql += ' JOIN devices d ON m.device_id = d.device_id';
      where.push('d.owner_id = ?');
      params.push(userId);
    }

    if (device_id) {
      where.push('m.device_id = ?');
      params.push(device_id);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY m.timestamp DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
    }

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    });
  }
);

// GET latest measurements
router.get('/latest', authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const isAdminOrOwner = req.user.roles.some(r =>
    ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(r)
  );

  let sql = `
    SELECT m.* FROM measurements m
    INNER JOIN (
      SELECT device_id, MAX(timestamp) ts
      FROM measurements
      GROUP BY device_id
    ) x
    ON m.device_id = x.device_id AND m.timestamp = x.ts
  `;
  let params = [];

  if (!isAdminOrOwner) {
    sql = `SELECT t.* FROM (${sql}) t
           JOIN devices d ON t.device_id = d.device_id
           WHERE d.owner_id = ?`;
    params.push(userId);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// POST measurements/create
router.post('/',
  authMiddleware,
  body('measurements').isArray({ min: 1 }),
  handleValidation,
  (req, res) => {
    const insert = db.prepare(`
      INSERT INTO measurements(device_id, type, value, timestamp)
      VALUES(?,?,?,?)
    `);

    db.serialize(() => {
      req.body.measurements.forEach(m => {
        insert.run(
          m.device_id,
          m.type,
          m.value,
          m.timestamp || new Date().toISOString()
        );
        evaluateThreshold(m);
      });
      insert.finalize();
      res.status(201).json({ inserted: req.body.measurements.length });
    });
  }
);

function evaluateThreshold(m) {
  db.get(
    'SELECT thresholds FROM thresholds WHERE scope="device" AND device_id=?',
    [m.device_id],
    (err, row) => {
      if (!row || !row.thresholds) return;
      const t = JSON.parse(row.thresholds);
      if (t[m.type] && m.value > t[m.type].max) {
        db.run(
          `INSERT INTO alerts(device_id,type,value,threshold,created_at)
           VALUES(?,?,?,?,datetime('now'))`,
          [m.device_id, m.type, m.value, t[m.type].max]
        );
      }
    }
  );
}

module.exports = router;