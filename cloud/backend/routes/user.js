const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../db');

// GET /api/users - List all users with ALL assigned devices
router.get('/', authMiddleware, async (req, res) => {
    try {
        // We fetch user details and join through device_users to the devices table
        const { data, error } = await supabase
            .from('users')
            .select(`
                user_id, 
                email, 
                full_name, 
                created_at, 
                device_users (
                    devices (
                        device_id,
                        device_name
                    )
                )
            `);

        if (error) throw error;

        // Map the nested Supabase structure into a clean format for the frontend
        const formattedUsers = (data || []).map(u => ({
            id: u.user_id,
            full_name: u.full_name || 'No Name',
            email: u.email || 'No Email',
            created_at: u.created_at,
            // Extract the device list into a flat array of objects
            assigned_devices: (u.device_users || [])
                .filter(du => du.devices !== null) // Filter out any broken links
                .map(du => ({
                    device_id: du.devices.device_id,
                    device_name: du.devices.device_name
                }))
        }));

        res.json(formattedUsers);
    } catch (err) {
        console.error("Fetch Users Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id - Fetch ONE user
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('user_id, email, full_name, created_at')
            .eq('user_id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'User not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id - Update user details
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        const updateData = {};
        if (full_name) updateData.full_name = full_name;
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('user_id', req.params.id);

        if (error) throw error;
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase.from('users').delete().eq('user_id', req.params.id);
        if (error) throw error;
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;