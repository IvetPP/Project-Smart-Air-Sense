const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../db');

router.get('/', authMiddleware, async (req, res) => {
    // Ownership check disabled for now
    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

module.exports = router;