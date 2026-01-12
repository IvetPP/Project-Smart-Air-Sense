const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../db');

// GET /api/users - List all users with ALL their assigned devices
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                user_id, 
                email, 
                full_name, 
                created_at, 
                device_users!fk_user_mapping ( device_id )
            `);

        if (error) throw error;

        const formattedUsers = (data || []).map(u => ({
            id: u.user_id,
            full_name: u.full_name || 'No Name',
            email: u.email || 'No Email',
            created_at: u.created_at,
            // Map the array of device objects into a flat array of IDs for Select2
            assigned_device_ids: u.device_users ? u.device_users.map(du => du.device_id) : []
        }));
        
        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id - Fetch ONE user for the edit page
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

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('user_id', req.params.id);

        if (error) throw error;
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id - Delete user
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