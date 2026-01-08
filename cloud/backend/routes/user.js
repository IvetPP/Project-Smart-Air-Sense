const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../db');

// GET /api/users
router.get('/', authMiddleware, async (req, res) => {
  try {
    // We fetch users AND the related records from device_users
    const { data, error } = await supabase
      .from('users')
      .select(`
        user_id, 
        email, 
        full_name, 
        created_at,
        device_users ( device_id )
      `);

    if (error) throw error;

    const formattedUsers = (data || []).map(u => {
        // device_users will be an array because it's a relationship
        // We take the first assigned device_id if it exists
        const assigned = u.device_users && u.device_users.length > 0 
            ? u.device_users[0].device_id 
            : 'None';

        return {
            id: u.user_id,
            full_name: u.full_name || 'No Name',
            email: u.email || 'No Email',
            created_at: u.created_at,
            assigned_device: assigned // This now fills the "Device" column
        };
    });

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