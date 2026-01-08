const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const supabase = require('../db');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, full_name, created_at');

    if (error) throw error;

    const formattedUsers = (data || []).map(u => ({
        id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        user_name: u.email ? u.email.split('@')[0] : 'Unknown',
        created_at: u.created_at
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error('Backend Error GET /user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;