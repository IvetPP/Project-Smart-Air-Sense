const express = require('express');
const router = express.Router();
const supabase = require('../db'); 
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/devices
router.get('/', authMiddleware, async (req, res) => {
    // TEMPORARY: Removed ownership filter so you can see colleague's data
    const { data, error } = await supabase.from('devices').select('*');
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/devices
router.post('/', authMiddleware, async (req, res) => {
    const { name, type, location } = req.body;
    const deviceId = uuidv4();
    const ownerId = req.user.sub;

    const { error } = await supabase.from('devices').insert({
        device_id: deviceId,
        name,
        type,
        location,
        status: 'OFF',
        owner_id: ownerId
    });

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ device_id: deviceId });
});

// PUT /api/devices/:device_id
router.put('/:device_id', authMiddleware, async (req, res) => {
    const { name, location, status } = req.body;
    const { error } = await supabase
        .from('devices')
        .update({ name, location, status })
        .eq('device_id', req.params.device_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Device updated' });
});

module.exports = router;