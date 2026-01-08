const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const supabase = require('../db');

// List users for Management Page
router.get('/', authMiddleware, roleMiddleware(['ROLE_ADMIN']), async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, full_name, created_at'); // Only get what we need

  if (error) return res.status(500).json({ error: error.message });

  // Map user_id to 'id' for frontend consistency
  const formattedUsers = data.map(u => ({
      ...u,
      id: u.user_id,
      user_name: u.email.split('@')[0] // Fallback for display
  }));

  res.json(formattedUsers);
});

// Get single user for Edit User Page
router.get('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

module.exports = router;