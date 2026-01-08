const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const supabase = require('../db'); 

// GET measurements
router.get('/',
  // authMiddleware, // Uncomment if you want to enforce login
  query('device_id').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('parameter').optional().isString(),
  handleValidation,
  async (req, res) => {
    try {
      const { device_id, limit, offset, from, to, parameter } = req.query; 

      let queryBuilder = supabase
        .from('iot_data')
        .select('*', { count: 'exact' }) 
        .order('created_at', { ascending: false });

      // 1. Filter by device
      if (device_id) {
        queryBuilder = queryBuilder.eq('device_id', device_id);
      }

      // 2. Filter by Date Range (Time)
      if (from) {
        // Appending T00:00:00 ensures it starts at the beginning of the day
        queryBuilder = queryBuilder.gte('created_at', `${from}T00:00:00`);
      }
      if (to) {
        // Appending T23:59:59 ensures it includes the whole end day
        queryBuilder = queryBuilder.lte('created_at', `${to}T23:59:59`);
      }

      // 3. Filter by Parameter
      // In wide format, we check if the specific column has data
      if (parameter && ['co2', 'temperature', 'humidity', 'pressure'].includes(parameter)) {
        queryBuilder = queryBuilder.not(parameter, 'is', null);
      }

      // 4. Pagination
      const parsedLimit = parseInt(limit) || 10;
      const parsedOffset = parseInt(offset) || 0;
      queryBuilder = queryBuilder.range(parsedOffset, parsedOffset + parsedLimit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      res.json({
        measurements: data,
        totalCount: count
      });

    } catch (err) {
      console.error('Supabase Error:', err);
      res.status(500).json({ error: err.message || 'Database error' });
    }
  }
);

// GET latest measurements (used for Dashboard)
router.get('/latest', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('iot_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20); 

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Supabase Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;