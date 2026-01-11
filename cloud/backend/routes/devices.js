const express = require('express');
const router = express.Router();
const supabase = require('../db'); 
const { authMiddleware } = require('../middleware/auth');

// GET all devices
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('devices')
            .select('device_id, device_name, location, device_type');
        
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Backend Error GET /devices:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET a single device by ID (REQUIRED for the Edit Page to load)
router.get('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('devices')
            .select('device_id, device_name, location, device_type')
            .eq('device_id', req.params.device_id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Device not found' });

        res.json(data);
    } catch (err) {
        console.error('Backend Error GET /devices/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE a device
router.put('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { device_name, location, device_type } = req.body;
        
        const { error } = await supabase
            .from('devices')
            .update({ 
                device_name: device_name,
                location: location,
                device_type: device_type
            })
            .eq('device_id', req.params.device_id);

        if (error) throw error;
        res.json({ message: 'Device updated' });
    } catch (err) {
        console.error('Backend Error PUT /devices:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE a device
router.delete('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('devices')
            .delete()
            .eq('device_id', req.params.device_id);

        if (error) throw error;
        res.json({ message: 'Device deleted' });
    } catch (err) {
        console.error('Backend Error DELETE /devices:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;