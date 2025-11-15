const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/connection');

// GET alerts (active or historical)
router.get('/', authMiddleware, (req,res)=>{
    db.all('SELECT * FROM alerts ORDER BY created_at DESC', [], (err,rows)=>{
        if(err) return res.status(500).json({ error:'DB error' });
        res.json(rows);
    });
});

module.exports = router;
