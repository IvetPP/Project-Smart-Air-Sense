const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
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
        const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
        const isAdminOrOwner = userRoles.some(role => ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(role));

        let sql = 'SELECT m.* FROM measurements m';
        let params = [];
        let whereClauses = [];

        if (!isAdminOrOwner) {
            sql += ' JOIN devices d ON m.device_id = d.device_id';
            whereClauses.push('d.owner_id = ?');
            params.push(userId);
        }

        if (device_id) {
            whereClauses.push('m.device_id = ?');
            params.push(device_id);
        }

        if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');

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
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
    const isAdminOrOwner = userRoles.some(role => ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(role));

    let sql = `
        SELECT m.* FROM measurements m
        INNER JOIN (
            SELECT device_id, MAX(timestamp) AS ts
            FROM measurements
            GROUP BY device_id
        ) AS latest
        ON m.device_id = latest.device_id AND m.timestamp = latest.ts
    `;
    let params = [];

    if (!isAdminOrOwner) {
        sql = `SELECT t.* FROM (${sql}) t JOIN devices d ON t.device_id = d.device_id WHERE d.owner_id = ?`;
        params.push(userId);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json(rows);
    });
});

module.exports = router;