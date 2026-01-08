const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, parameter, from, to } = req.query;

        // 1. Build the base query for measurements
        let query = supabase
            .from('measurements')
            .select(`
                *,
                devices ( device_name )
            `, { count: 'exact' }); // { count: 'exact' } is vital for pagination

        // 2. Apply Filters
        if (device_id) query = query.eq('device_id', device_id);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);
        
        // Note: 'parameter' filtering is usually handled in frontend render logic
        // as measurements usually contain all params in one row.

        // 3. Apply Pagination & Sorting
        query = query
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        // 4. Format the data to match history.js expectations
        const formattedMeasurements = (data || []).map(m => ({
            ...m,
            device_name: m.devices?.device_name || m.device_id || 'Unknown Device'
        }));

        // RETURN THE OBJECT FORMAT history.js EXPECTS
        res.json({
            measurements: formattedMeasurements,
            totalCount: count || 0
        });

    } catch (err) {
        console.error('History API Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;