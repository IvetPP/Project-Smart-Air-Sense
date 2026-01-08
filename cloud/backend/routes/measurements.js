const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

/* ============================================================
   GET /api/measurements/
   Fixed to handle missing relationships and fragmented data
   ============================================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, from, to } = req.query;

        // 1. Prepare base query - attempting a join with 'devices'
        let query = supabase
            .from('iot_data') 
            .select(`
                *,
                devices ( device_name )
            `, { count: 'exact' });

        // 2. Apply Filters
        if (device_id && device_id.trim() !== "" && device_id !== "null") {
            // Using .eq because your data sample shows exact 'co2-monitor:0' strings
            query = query.eq('device_id', device_id.trim());
        }

        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        // 3. Pagination & Sort
        const start = parseInt(offset) || 0;
        const end = start + (parseInt(limit) || 10) - 1;

        let { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(start, end);

        // 4. Fallback: If join fails, fetch raw iot_data without the device name
        if (error && error.message.includes("relationship")) {
            console.warn("Relationship missing, falling back to raw data...");
            const fallback = await supabase
                .from('iot_data')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, end);
            
            data = fallback.data;
            error = fallback.error;
            count = fallback.count;
        }

        if (error) throw error;

        // 5. Format for UI
        const formatted = (data || []).map(m => ({
            ...m,
            // Ensure device_name exists for the table column
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
            query = query.eq('device_id', device_id.trim());
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