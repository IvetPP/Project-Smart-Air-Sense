const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
// Use the new Supabase connection
const supabase = require('../db'); 

// GET measurements
router.get('/',
  authMiddleware,
  query('device_id').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidation,
  async (req, res) => {
    try {
      const { device_id, limit } = req.query;

      // START SUPABASE QUERY
      let queryBuilder = supabase
        .from('measurements')
        .select('*')
        .order('timestamp', { ascending: false });

      // 1. TEMPORARILY DISABLED USER FILTER
      // We are commenting this out because your data doesn't have owner_id/user_id yet
      /*
      const userId = req.user.sub;
      const isAdminOrOwner = req.user.roles.some(r => ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(r));
      if (!isAdminOrOwner) {
         queryBuilder = queryBuilder.eq('owner_id', userId); 
      }
      */

      // 2. Filter by device if requested
      if (device_id) {
        queryBuilder = queryBuilder.eq('device_id', device_id);
      }

      // 3. Set limit
      if (limit) {
        queryBuilder = queryBuilder.limit(parseInt(limit));
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      res.json(data);

    } catch (err) {
      console.error('Supabase Error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// GET latest measurements
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    // This query gets the most recent row for every device
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .order('timestamp', { ascending: false });
      // Note: In a real app, you'd use a more complex 'distinct' query, 
      // but this will return data so you can see if it's working.

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;