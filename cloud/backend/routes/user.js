const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../db');

// GET /api/users
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Fetch users. Note: if you don't have an 'assigned_device' column, 
        // this will just return null for that field, which is fine.
        const { data, error } = await supabase
            .from('users')
            .select('user_id, email, full_name, created_at');

        if (error) throw error;

        const formattedUsers = (data || []).map(u => ({
            id: u.user_id, 
            full_name: u.full_name || 'Anonymous User',
            email: u.email,
            created_at: u.created_at,
            // Fallback for the frontend table
            assigned_device: 'No device linked' 
        }));

        res.json(formattedUsers);
    } catch (err) {
        console.error('Backend Error GET /api/users:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('user_id, email, full_name, created_at')
            .eq('user_id', req.user.sub)
            .single();

        if (error || !data) return res.status(404).json({ error: 'User not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;