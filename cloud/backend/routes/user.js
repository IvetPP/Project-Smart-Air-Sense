const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const supabase = require('../db');

// This handles GET /api/users
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, full_name, created_at');

    if (error) throw error;

    // Map the data so the frontend names match (id, full_name, etc.)
    const formattedUsers = (data || []).map(u => ({
        id: u.user_id,
        full_name: u.full_name || 'No Name',
        email: u.email,
        user_name: u.email ? u.email.split('@')[0] : 'Unknown',
        created_at: u.created_at
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error('Backend Error GET /api/users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// This handles GET /api/users/profile
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