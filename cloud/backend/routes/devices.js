const express = require('express');
const router = express.Router();
const supabase = require('../db'); 
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/devices
 * Returns filtered list based on user ownership or admin status.
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        // 1. Extract the ID from the 'sub' field (from your auth.js login)
        const userId = parseInt(req.user.sub, 10);
        const isAdmin = req.user.roles && req.user.roles.includes('admin');

        if (isNaN(userId) && !isAdmin) {
            return res.status(401).json({ error: "Invalid User ID in token" });
        }

        let query = supabase
            .from('devices')
            .select('device_id, device_name, location, device_type, registration_date');

        // 2. Apply filtering for regular users
        if (!isAdmin) {
            const { data: userMappings, error: mapError } = await supabase
                .from('device_users')
                .select('device_id')
                .eq('user_id', userId); // userId is now a guaranteed integer

            if (mapError) throw mapError;

            // If user has no devices, stop here and return empty list
            if (!userMappings || userMappings.length === 0) {
                return res.json([]);
            }

            const allowedIds = userMappings.map(m => m.device_id);
            query = query.in('device_id', allowedIds);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        res.json(data || []);
    } catch (err) {
        console.error("Error in GET /devices:", err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/devices/:device_id
 */
router.get('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { device_id } = req.params;
        const userId = parseInt(req.user.sub, 10);
        const isAdmin = req.user.roles && req.user.roles.includes('admin');

        if (!isAdmin) {
            const { data: permission } = await supabase
                .from('device_users')
                .select('id')
                .eq('user_id', userId)
                .eq('device_id', device_id)
                .maybeSingle();

            if (!permission) {
                return res.status(403).json({ error: 'Access denied to this device' });
            }
        }

        const { data, error } = await supabase
            .from('devices')
            .select('device_id, device_name, location, device_type, registration_date')
            .eq('device_id', device_id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/devices
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { device_name, device_type, location, registration_date } = req.body;
        const userId = parseInt(req.user.sub, 10);
        
        const shortUuid = uuidv4().substring(0, 8);
        const formattedType = (device_type || 'sensor').toLowerCase().replace(/\s+/g, '-');
        const newDeviceId = `${formattedType}:${shortUuid}`;

        const { data, error } = await supabase
            .from('devices')
            .insert([{ 
                device_id: newDeviceId, 
                device_name, 
                device_type, 
                location,
                registration_date: registration_date || new Date().toISOString().split('T')[0]
            }])
            .select().single();

        if (error) throw error;

        // Automatically assign device to creator if not admin
        if (!req.user.roles.includes('admin')) {
            await supabase.from('device_users').insert([{ user_id: userId, device_id: newDeviceId }]);
        }

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/devices/:device_id
 */
router.put('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { device_name, location, device_type, registration_date } = req.body;
        const userId = parseInt(req.user.sub, 10);
        const isAdmin = req.user.roles.includes('admin');

        // Verification check before update
        if (!isAdmin) {
            const { data } = await supabase.from('device_users').select('id').eq('user_id', userId).eq('device_id', req.params.device_id).maybeSingle();
            if (!data) return res.status(403).json({ error: 'Not authorized' });
        }

        const { error } = await supabase
            .from('devices')
            .update({ device_name, location, device_type, registration_date })
            .eq('device_id', req.params.device_id);
            
        if (error) throw error;
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/devices/:device_id
 */
router.delete('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase.from('devices').delete().eq('device_id', req.params.device_id);
        if (error) throw error;
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;