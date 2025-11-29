const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const { body } = require('express-validator');
const db = require('../db/connection');

// POST save/update thresholds (Restricted to owner for device scope, or Admin/Owner)
router.post('/',
    authMiddleware,
    body('scope').isString(),
    body('device_id').optional().isString(),
    body('thresholds').isObject(),
    handleValidation,
    (req, res) => {
        const { scope, device_id, thresholds } = req.body;
        const userId = req.user.sub;
        const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
        const isAdminOrOwner = userRoles.some(role => ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(role));

        // 1. Authorization Check for Device Scope
        if (scope === 'device' && device_id && !isAdminOrOwner) {
            db.get('SELECT owner_id FROM devices WHERE device_id=?', [device_id], (err, row) => {
                if (err) return res.status(500).json({ error: 'DB error' });
                if (!row) return res.status(404).json({ error: 'Device not found' });
                if (row.owner_id !== userId) {
                    return res.status(403).json({ error: 'Forbidden: You do not own this device' });
                }
                saveThreshold();
            });
        } else if (scope === 'global' || scope === 'group' || isAdminOrOwner) {
            saveThreshold();
        } else {
            return res.status(400).json({ error: 'Invalid scope or missing device ID' });
        }

        // 2. Database Operation (encapsulated)
        function saveThreshold() {
            const t = JSON.stringify(thresholds);
            const devId = scope === 'device' ? device_id : null;

            db.get('SELECT id FROM thresholds WHERE scope=? AND device_id IS ?', [scope, devId], (err, row) => {
                if (err) return res.status(500).json({ error: 'DB error' });
                if (row) {
                    db.run('UPDATE thresholds SET thresholds=?, updated_at=datetime("now") WHERE id=?', [t, row.id], err => {
                        if (err) return res.status(500).json({ error: 'DB error' });
                        res.json({ message: 'Threshold updated' });
                    });
                } else {
                    db.run('INSERT INTO thresholds(scope, device_id, thresholds, updated_at) VALUES(?,?,?,datetime("now"))', [scope, devId, t], err => {
                        if (err) return res.status(500).json({ error: 'DB error' });
                        res.status(201).json({ message: 'Threshold created' });
                    });
                }
            });
        }
    }
);

module.exports = router;