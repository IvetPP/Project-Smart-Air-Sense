const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

/* ============================================================
   GET /api/measurements/
   Updated to handle server-side parameter filtering and pagination
   ============================================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        // 1. Destructure all possible query parameters
        const { 
            limit = 10, 
            offset = 0, 
            device_id, 
            from, 
            to, 
            parameter // Added parameter filter
        } = req.query;

        // 2. Prepare base query with 'exact' count for pagination
        let query = supabase
            .from('iot_data') 
            .select(`
                *,
                devices ( device_name )
            `, { count: 'exact' });

        // 3. Apply Filters
        // Device ID Filter
        if (device_id && device_id.trim() !== "" && device_id !== "null") {
            query = query.eq('device_id', device_id.trim());
        }

        // Date Range Filters
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        // Parameter Filter (The fix for your pagination issue)
        // If a parameter is selected, only return rows where that specific column is NOT NULL
        if (parameter && parameter.trim() !== "" && parameter !== "null") {
            query = query.not(parameter, 'is', null);
        }

        // 4. Pagination & Sort
        const start = parseInt(offset) || 0;
        const end = start + (parseInt(limit) || 10) - 1;

        let { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(start, end);

        // 5. Fallback: If join fails, fetch raw iot_data without the device name
        if (error && error.message.includes("relationship")) {
            console.warn("Relationship missing, falling back to raw data...");
            
            let fallbackQuery = supabase
                .from('iot_data')
                .select('*', { count: 'exact' });

            // Re-apply parameter filter to fallback query
            if (parameter && parameter.trim() !== "" && parameter !== "null") {
                fallbackQuery = fallbackQuery.not(parameter, 'is', null);
            }

            const fallback = await fallbackQuery
                .order('created_at', { ascending: false })
                .range(start, end);
            
            data = fallback.data;
            error = fallback.error;
            count = fallback.count;
        }

        if (error) throw error;

        // 6. Format for UI
        const formatted = (data || []).map(m => ({
            ...m,
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