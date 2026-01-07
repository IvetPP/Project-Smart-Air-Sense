const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
// Use the new Supabase connection
const supabase = require('../db'); 

// GET measurements
router.get('/',
  //authMiddleware,
  query('device_id').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  handleValidation,
  async (req, res) => {
    try {
      const { device_id, limit, offset } = req.query; 

      // Use { count: 'exact' } to get the total number of rows matching the query
      let queryBuilder = supabase
        .from('iot_data')
        .select('*', { count: 'exact' }) 
        .order('created_at', { ascending: false });

      if (device_id) {
        queryBuilder = queryBuilder.eq('device_id', device_id);
      }

      const parsedLimit = parseInt(limit) || 10;
      const parsedOffset = parseInt(offset) || 0;
      
      queryBuilder = queryBuilder.range(parsedOffset, parsedOffset + parsedLimit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      // Return an object containing both the rows and the total count
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