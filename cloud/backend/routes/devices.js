const express = require('express');
const router = express.Router();
const supabase = require('../db'); 
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all devices (for the dropdown)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('devices')
            .select('device_id, device_name, location, device_type, registration_date');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NEW: GET all devices already assigned to a specific user
router.get('/assigned/:userId', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('device_users')
            .select('device_id, devices(device_name)')
            .eq('user_id', req.params.userId);

        if (error) throw error;

        // Flatten the join result so frontend gets a clean list
        const formatted = data.map(item => ({
            device_id: item.device_id,
            device_name: item.devices ? item.devices.device_name : 'Unknown Device'
        }));
        
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NEW: POST assign a device to a user
router.post('/assign', authMiddleware, async (req, res) => {
    try {
        const { device_id, user_id } = req.body;
        const { data, error } = await supabase
            .from('device_users')
            .insert([{ device_id, user_id }]);

        if (error) throw error;
        res.status(201).json({ message: 'Device assigned successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Possible duplicate assignment or database error' });
    }
});

// GET single device
router.get('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('devices')
            .select('device_id, device_name, location, device_type, registration_date')
            .eq('device_id', req.params.device_id)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new device
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { device_name, device_type, location, registration_date } = req.body;
        const shortUuid = uuidv4().substring(0, 8);
        const formattedType = device_type.toLowerCase().replace(/\s+/g, '-');
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
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update device
router.put('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { device_name, location, device_type, registration_date } = req.body;
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