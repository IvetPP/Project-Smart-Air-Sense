const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, from, to } = req.query;

        // Base query with a LEFT JOIN to devices
        let query = supabase
            .from('measurements')
            .select(`
                *,
                devices!left ( device_name )
            `, { count: 'exact' });

        // Filter by device_id if provided
        if (device_id && device_id.trim() !== "" && device_id !== "null" && device_id !== "undefined") {
            // Using .ilike handles case-sensitivity and trailing spaces better than .eq
            query = query.ilike('device_id', device_id.trim());
        }

        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        const start = parseInt(offset) || 0;
        const end = start + (parseInt(limit) || 10) - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) {
            console.error("Supabase SQL Error:", error.message);
            throw error;
        }

        const formatted = (data || []).map(m => ({
            ...m,
            device_name: m.devices?.device_name || m.device_id || 'Unknown Device'
        }));

        // Log this to your Render console to see what's happening
        console.log(`[History] Filter: ${device_id || 'NONE'} | Found: ${formatted.length} | Total: ${count}`);

        res.json({
            measurements: formatted,
            totalCount: count || 0
        });
    } catch (err) {
        console.error('History Route Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/latest', authMiddleware, async (req, res) => {
    try {
        const { device_id } = req.query;
        let query = supabase.from('measurements').select('*').order('created_at', { ascending: false }).limit(1);
        
        if (device_id && device_id.trim() !== "" && device_id !== "null") {
            query = query.ilike('device_id', device_id.trim());
        }

        const { data, error } = await query;
        if (error) throw error;

        console.log(`[Latest] Filter: ${device_id || 'NONE'} | Result: ${data?.length > 0 ? 'Success' : 'Empty'}`);
        res.json(data || []);
    } catch (err) {
        console.error('Latest Route Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;