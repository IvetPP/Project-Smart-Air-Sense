const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, from, to } = req.query;

        // 1. We use a base query. 
        // Note: We don't filter device_id inside the .select() to avoid Join issues
        let query = supabase
            .from('measurements')
            .select(`
                *,
                devices!left ( device_name )
            `, { count: 'exact' });

        // 2. Handle the "All Devices" case (empty string or null)
        if (device_id && device_id.trim() !== "" && device_id !== "null" && device_id !== "undefined") {
            query = query.eq('device_id', device_id);
        }

        // 3. Apply Date Filters
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        // 4. Sort and Range
        const start = parseInt(offset) || 0;
        const end = start + (parseInt(limit) || 10) - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) {
            console.error("Supabase Query Error:", error);
            throw error;
        }

        // 5. Format for the frontend history.js
        const formatted = (data || []).map(m => ({
            ...m,
            // Use the joined name, then the raw ID, then a fallback
            device_name: m.devices?.device_name || m.device_id || 'Unknown Device'
        }));

        console.log(`Sending ${formatted.length} rows to frontend. Total count: ${count}`);

        res.json({
            measurements: formatted,
            totalCount: count || 0
        });
    } catch (err) {
        console.error('History Route Crash:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Latest route for Dashboard
router.get('/latest', authMiddleware, async (req, res) => {
    try {
        const { device_id } = req.query;
        let query = supabase.from('measurements').select('*').order('created_at', { ascending: false }).limit(1);
        
        if (device_id && device_id.trim() !== "") {
            query = query.eq('device_id', device_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;