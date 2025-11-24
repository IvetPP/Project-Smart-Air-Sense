const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/connection');

// GET /api/alerts (active or historical)
router.get('/', authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
    const isAdminOrOwner = userRoles.some(role =>
        ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(role)
    );

    let sql = 'SELECT a.* FROM alerts a';
    let params = [];

    // Ownership Filter: If not Admin/Owner, join with devices table
    if (!isAdminOrOwner) {
        sql += ' JOIN devices d ON a.device_id = d.device_id WHERE d.owner_id = ?';
        params.push(userId);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json(rows);
    });
});

module.exports = router;