const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const supabase = require('../db');

router.get('/profile', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, full_name, roles, created_at')
    .eq('user_id', req.user.sub)
    .single();

  if (error || !data) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

router.get('/', authMiddleware, roleMiddleware(['ROLE_ADMIN', 'ROLE_LICENSE_OWNER']), async (req, res) => {
  const { data, error } = await supabase.from('users').select('user_id, email, full_name, roles, status, created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;