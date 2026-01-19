const express = require('express');
const router = express.Router();
const supabase = require('../db'); 
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/devices
 * Returns all devices if ADMIN, or only assigned devices if regular USER.
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id; // Check if your JWT uses 'id' or 'user_id'
        const isAdmin = req.user.roles.includes('admin');

        let query = supabase
            .from('devices')
            .select('device_id, device_name, location, device_type, registration_date');

        // If NOT an admin, filter by the device_users mapping table
        if (!isAdmin) {
            // 1. Get the list of device IDs assigned to this specific user
            const { data: userMappings, error: mapError } = await supabase
                .from('device_users')
                .select('device_id')
                .eq('user_id', userId);

            if (mapError) throw mapError;

            // If the user has no devices assigned, return an empty array early
            if (!userMappings || userMappings.length === 0) {
                return res.json([]);
            }

            // 2. Filter the main devices query to only include those IDs
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
 * Security check: ensures user has permission to view this specific device.
 */
router.get('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { device_id } = req.params;
        const userId = req.user.user_id;
        const isAdmin = req.user.roles.includes('admin');

        // Security Check for non-admins
        if (!isAdmin) {
            const { data: permission } = await supabase
                .from('device_users')
                .select('id')
                .eq('user_id', userId)
                .eq('device_id', device_id)
                .single();

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

// POST new device (usually kept for admins or specific setups)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { device_name, device_type, location, registration_date } = req.body;
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

        // OPTIONAL: If a regular user creates a device, automatically assign it to them
        if (!req.user.roles.includes('admin')) {
            await supabase.from('device_users').insert([{ user_id: req.user.user_id, device_id: newDeviceId }]);
        }

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update device
router.put('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { device_name, location, device_type, registration_date } = req.body;
        
        // Safety: Only update if admin OR user owns the device
        // (Implementation similar to GET /:device_id security check)

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

// DELETE device
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