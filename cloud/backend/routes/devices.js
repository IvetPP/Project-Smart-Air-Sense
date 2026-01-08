const express = require('express');
const router = express.Router();
const supabase = require('../db'); 
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all devices
router.get('/', authMiddleware, async (req, res) => {
    // Note: 'name as device_name' maps the DB column to what the frontend expects
    const { data, error } = await supabase
        .from('devices')
        .select('device_id, name, type, location, status, owner_id');
    
    if (error) return res.status(500).json({ error: error.message });

    // Map the internal 'name' to 'device_name' for frontend compatibility
    const formattedData = data.map(d => ({
        ...d,
        device_name: d.name,
        device_type: d.type
    }));

    res.json(formattedData);
});

// POST /api/devices
router.post('/', authMiddleware, async (req, res) => {
    // Mapping frontend names to DB columns
    const { device_name, device_type, location } = req.body; 
    const deviceId = uuidv4();
    const ownerId = req.user.sub;

    const { error } = await supabase.from('devices').insert({
        device_id: deviceId,
        name: device_name, // Mapping frontend 'device_name' to DB 'name'
        type: device_type, // Mapping frontend 'device_type' to DB 'type'
        location,
        status: 'OFF',
        owner_id: ownerId
    });

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ device_id: deviceId });
});

// PUT /api/devices/:device_id
router.put('/:device_id', authMiddleware, async (req, res) => {
    const { device_name, device_type, location, status } = req.body;
    
    const { error } = await supabase
        .from('devices')
        .update({ 
            name: device_name, 
            type: device_type,
            location, 
            status 
        })
        .eq('device_id', req.params.device_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Device updated' });
});

module.exports = router;