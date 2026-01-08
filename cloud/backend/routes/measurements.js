const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const supabase = require('../db'); 

router.get('/',
  authMiddleware,
  handleValidation,
  async (req, res) => {
    try {
      const { device_id, limit, offset, from, to } = req.query; 

      // THE FIX: select devices(name) to get the device name via foreign key
      let queryBuilder = supabase
        .from('iot_data')
        .select('*, devices(name)', { count: 'exact' }) 
        .order('created_at', { ascending: false });

      if (device_id) queryBuilder = queryBuilder.eq('device_id', device_id);

      if (from) queryBuilder = queryBuilder.gte('created_at', `${from}T00:00:00`);
      if (to) queryBuilder = queryBuilder.lte('created_at', `${to}T23:59:59`);

      const parsedLimit = parseInt(limit) || 10;
      const parsedOffset = parseInt(offset) || 0;
      queryBuilder = queryBuilder.range(parsedOffset, parsedOffset + parsedLimit - 1);

      const { data, error, count } = await queryBuilder;
      if (error) throw error;

      // Flatten the data so 'device_name' is easy to access for the table
      const formatted = data.map(m => ({
          ...m,
          device_name: m.devices ? m.devices.name : m.device_id
      }));

      res.json({ measurements: formatted, totalCount: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET latest (Dashboard)
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const { device_id } = req.query;
    let queryBuilder = supabase.from('iot_data').select('*').order('created_at', { ascending: false });

    if (device_id) queryBuilder = queryBuilder.eq('device_id', device_id);

    const { data, error } = await queryBuilder.limit(1); // Usually dashboard only needs the single latest

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;