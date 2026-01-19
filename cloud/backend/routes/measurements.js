const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

/* ============================================================
   HELPER: Check Device Permission
   ============================================================ */
async function hasDevicePermission(userId, deviceId, roles) {
    if (roles.includes('admin')) return true;
    
    const { data, error } = await supabase
        .from('device_users')
        .select('id')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .maybeSingle(); // Returns null if not found instead of throwing error
    
    return !!data; // returns true if mapping exists
}

/* ============================================================
   GET /api/measurements/
   ============================================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, from, to, parameter } = req.query;
        const userId = req.user.user_id;
        const userRoles = req.user.roles || [];

        // 1. SECURITY CHECK: If device_id is provided, verify ownership
        if (device_id && device_id.trim() !== "" && device_id !== "null") {
            const allowed = await hasDevicePermission(userId, device_id.trim(), userRoles);
            if (!allowed) {
                return res.status(403).json({ error: 'Access denied to this device data' });
            }
        } else if (!userRoles.includes('admin')) {
            // If no device_id specified and not admin, user shouldn't be allowed to 
            // query "all" measurements globally.
            return res.status(400).json({ error: 'device_id is required' });
        }

        // 2. Prepare base query
        let query = supabase
            .from('iot_data') 
            .select(`
                *,
                devices ( device_name )
            `, { count: 'exact' });

        // 3. Apply Filters
        if (device_id) query = query.eq('device_id', device_id.trim());
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);
        if (parameter && parameter.trim() !== "" && parameter !== "null") {
            query = query.not(parameter, 'is', null);
        }

        // 4. Pagination & Sort
        const start = parseInt(offset) || 0;
        const end = start + (parseInt(limit) || 10) - 1;

        let { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(start, end);

        // 5. Fallback for Relationship issues
        if (error && error.message.includes("relationship")) {
            let fallbackQuery = supabase.from('iot_data').select('*', { count: 'exact' });
            if (device_id) fallbackQuery = fallbackQuery.eq('device_id', device_id.trim());
            if (parameter) fallbackQuery = fallbackQuery.not(parameter, 'is', null);

            const fallback = await fallbackQuery
                .order('created_at', { ascending: false })
                .range(start, end);
            
            data = fallback.data;
            error = fallback.error;
            count = fallback.count;
        }

        if (error) throw error;

        const formatted = (data || []).map(m => ({
            ...m,
            device_name: m.devices?.device_name || m.device_id || 'Unknown Device'
        }));

        res.json({ measurements: formatted, totalCount: count || 0 });
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
        const userId = req.user.user_id;
        const userRoles = req.user.roles || [];

        if (!device_id || device_id === "null") {
            return res.status(400).json({ error: 'device_id is required' });
        }

        // SECURITY CHECK
        const allowed = await hasDevicePermission(userId, device_id.trim(), userRoles);
        if (!allowed) {
            return res.status(403).json({ error: 'Access denied to this device' });
        }

        const { data, error } = await supabase
            .from('iot_data')
            .select('*')
            .eq('device_id', device_id.trim())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Latest Route Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;