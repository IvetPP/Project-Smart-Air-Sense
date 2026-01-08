const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

/* ============================================================
   GET /api/measurements/latest
   Used by Dashboard.js
   ============================================================ */
router.get('/latest', authMiddleware, async (req, res) => {
    try {
        const { device_id } = req.query;

        let query = supabase
            .from('measurements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (device_id) {
            query = query.eq('device_id', device_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching latest:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/* ============================================================
   GET /api/measurements/
   Used by History.js (Matches the URL: /api/measurements?limit=10...)
   ============================================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, from, to } = req.query;

        let query = supabase
            .from('measurements')
            .select(`
                *,
                devices ( device_name )
            `, { count: 'exact' });

        if (device_id) query = query.eq('device_id', device_id);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        query = query
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        const formatted = (data || []).map(m => ({
            ...m,
            device_name: m.devices?.device_name || m.device_id || 'Unknown'
        }));

        res.json({
            measurements: formatted,
            totalCount: count || 0
        });
    } catch (err) {
        console.error('Error fetching history:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;