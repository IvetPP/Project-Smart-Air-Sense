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
        .maybeSingle(); 
    
    return !!data; 
}

/* ============================================================
    GET /api/measurements/
   ============================================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0, device_id, from, to, parameter } = req.query;
        
        // FIX 1 & 2: Use 'sub' and ensure it is an Integer
        const userId = parseInt(req.user.sub, 10);
        const userRoles = req.user.roles || [];
        const isAdmin = userRoles.includes('admin');

        // Prepare base query
        let query = supabase
            .from('iot_data') 
            .select(`
                *,
                devices ( device_name )
            `, { count: 'exact' });

        // --- FIX 3: SECURITY & AUTO-FILTERING ---
        if (!isAdmin) {
            // Get all devices assigned to this user
            const { data: mappings } = await supabase
                .from('device_users')
                .select('device_id')
                .eq('user_id', userId);

            const allowedIds = mappings?.map(m => m.device_id) || [];

            if (allowedIds.length === 0) {
                // User has no devices, return empty set instead of error
                return res.json({ measurements: [], totalCount: 0 });
            }

            if (device_id && device_id.trim() !== "" && device_id !== "null") {
                // If specific device requested, verify ownership
                if (!allowedIds.includes(device_id.trim())) {
                    return res.status(403).json({ error: 'Access denied to this device data' });
                }
                query = query.eq('device_id', device_id.trim());
            } else {
                // If NO device_id provided, show data for ALL their assigned devices
                query = query.in('device_id', allowedIds);
            }
        } else {
            // Admin logic: only filter if they explicitly provided an ID
            if (device_id && device_id.trim() !== "" && device_id !== "null") {
                query = query.eq('device_id', device_id.trim());
            }
        }

        // Apply shared filters
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);
        if (parameter && parameter.trim() !== "" && parameter !== "null") {
            query = query.not(parameter, 'is', null);
        }

        // Pagination & Sort
        const start = parseInt(offset) || 0;
        const end = start + (parseInt(limit) || 10) - 1;

        let { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(start, end);

        // Fallback for Relationship issues
        if (error && error.message.includes("relationship")) {
            console.warn("Falling back to raw iot_data query");
            let fallbackQuery = supabase.from('iot_data').select('*', { count: 'exact' });
            
            // Re-apply the same filters used above to fallback
            if (!isAdmin) {
                const { data: m } = await supabase.from('device_users').select('device_id').eq('user_id', userId);
                const ids = m?.map(i => i.device_id) || [];
                if (device_id) { fallbackQuery = fallbackQuery.eq('device_id', device_id.trim()); }
                else { fallbackQuery = fallbackQuery.in('device_id', ids); }
            } else if (device_id) {
                fallbackQuery = fallbackQuery.eq('device_id', device_id.trim());
            }

            const fallback = await fallbackQuery.order('created_at', { ascending: false }).range(start, end);
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
        const userId = parseInt(req.user.sub, 10);
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