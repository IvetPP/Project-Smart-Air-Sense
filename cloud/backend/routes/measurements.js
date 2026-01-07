const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
// Use the new Supabase connection
const supabase = require('../db'); 

// GET measurements
router.get('/',
  // authMiddleware,
  query('device_id').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }), // Add validation for offset
  handleValidation,
  async (req, res) => {
    try {
      // Destructure offset from req.query
      const { device_id, limit, offset } = req.query; 

      let queryBuilder = supabase
        .from('iot_data')
        .select('*', { count: 'planned' }) // Optional: gets total count for better pagination
        .order('created_at', { ascending: false });

      if (device_id) {
        queryBuilder = queryBuilder.eq('device_id', device_id);
      }

      // Handle Pagination using .range(from, to)
      const parsedLimit = parseInt(limit) || 10;
      const parsedOffset = parseInt(offset) || 0;
      
      // Supabase range is inclusive: (0, 9) returns 10 rows
      queryBuilder = queryBuilder.range(parsedOffset, parsedOffset + parsedLimit - 1);

      const { data, error } = await queryBuilder;

      if (error) throw error;
      res.json(data);

    } catch (err) {
      console.error('Supabase Error:', err);
      res.status(500).json({ error: err.message || 'Database error' });
    }
  }
);

// GET latest measurements
router.get('/latest', async (req, res) => {
  try {
    // Fetch the last 20 rows to ensure we get all types (co2, temp, etc.)
    const { data, error } = await supabase
      .from('iot_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20); 

    if (error) throw error;
    
    // Log for debugging - you'll see this in Render logs
    console.log("Supabase Data fetched:", data.length, "rows");
    
    res.json(data);
  } catch (err) {
    console.error('Supabase Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;