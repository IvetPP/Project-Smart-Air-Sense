const express = require('express');
const router = express.Router();
const supabase = require('../db'); 
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', authMiddleware, async (req, res) => {
    try {
        // We select the correct column 'device_name' as per your error logs
        const { data, error } = await supabase
            .from('devices')
            .select('device_id, device_name, location');
        
        if (error) throw error;

        res.json(data || []);
    } catch (err) {
        console.error('Backend Error GET /devices:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:device_id', authMiddleware, async (req, res) => {
    try {
        const { device_name, location } = req.body;
        
        const { error } = await supabase
            .from('devices')
            .update({ 
                device_name: device_name, // Updated to match DB column
                location: location
            })
            .eq('device_id', req.params.device_id);

        if (error) throw error;
        res.json({ message: 'Device updated' });
    } catch (err) {
        console.error('Backend Error PUT /devices:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;