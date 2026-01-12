const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../db');

// POST /api/device-users/sync - Sync n:m relations
router.post('/sync', authMiddleware, async (req, res) => {
    const { user_id, device_ids } = req.body; // device_ids is an array from Select2

    try {
        // 1. Remove all current mappings for this user
        const { error: delError } = await supabase
            .from('device_users')
            .delete()
            .eq('user_id', user_id);

        if (delError) throw delError;

        // 2. Insert new mappings if devices were selected
        if (device_ids && device_ids.length > 0) {
            const insertData = device_ids.map(dId => ({
                user_id: user_id,
                device_id: dId
            }));

            const { error: insError } = await supabase
                .from('device_users')
                .insert(insertData);

            if (insError) throw insError;
        }

        res.json({ message: 'Mapping updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;