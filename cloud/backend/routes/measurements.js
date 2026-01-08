const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

/* ============================================================
   GET /api/measurements/
   Now correctly pointing to 'iot_data'
   ============================================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, from, to } = req.query;

        // 1. Point to 'iot_data' instead of 'measurements'
        let query = supabase
            .from('iot_data') 
            .select(`
                *,
                devices!left ( device_name )
            `, { count: 'exact' });

        // 2. Apply Filters
        if (device_id && device_id.trim() !== "" && device_id !== "null") {
            query = query.ilike('device_id', device_id.trim());
        }

        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        // 3. Pagination
        const start = parseInt(offset) || 0;
        const end = start + (parseInt(limit) || 10) - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) throw error;

        // 4. Format for History.js
        const formatted = (data || []).map(m => ({
            ...m,
            // Fallback for UI: checks for 'iot_data' columns
            device_name: m.devices?.device_name || m.device_id || 'Unknown Device'
        }));

        res.json({
            measurements: formatted,
            totalCount: count || 0
        });
    } catch (err) {
        console.error('History Route Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/* ============================================================
   GET /api/measurements/latest
   ============================================================ */
router.get('/latest', authMiddleware, async (req, res) => {
    try {
        const { device_id } = req.query;

        let query = supabase
            .from('iot_data')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (device_id && device_id.trim() !== "" && device_id !== "null") {
            query = query.ilike('device_id', device_id.trim());
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Latest Route Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;