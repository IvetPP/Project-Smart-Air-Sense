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

        // Only filter if a valid ID is provided
        if (device_id && device_id.trim() !== "" && device_id !== "null") {
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
   Used by History.js
   ============================================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, from, to } = req.query;

        // Start base query with relationship join
        let query = supabase
            .from('measurements')
            .select(`
                *,
                devices ( device_name )
            `, { count: 'exact' });

        // FIX: Guard against empty strings from the frontend dropdown
        if (device_id && device_id.trim() !== "" && device_id !== "null") {
            query = query.eq('device_id', device_id);
        }

        // Apply Date Filters
        if (from) {
            query = query.gte('created_at', from);
        }
        if (to) {
            query = query.lte('created_at', to);
        }

        // Apply Pagination and Sorting
        const start = parseInt(offset);
        const end = start + parseInt(limit) - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(start, end);

        const { data, error, count } = await query;

        if (error) throw error;

        // Format for frontend
        const formatted = (data || []).map(m => ({
            ...m,
            // Fallback chain: Device Name -> Device ID -> 'Unknown'
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