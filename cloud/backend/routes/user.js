const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/connection');

// Get profile of logged-in user
router.get('/profile', authMiddleware, (req,res)=>{
    const userId = req.user.sub;
    db.get('SELECT user_id,email,full_name,roles,created_at FROM users WHERE user_id=?',[userId], (err,row)=>{
        if(err) return res.status(500).json({ error: 'DB error' });
        if(!row) return res.status(404).json({ error:'User not found' });
        res.json(row);
    });
});

module.exports = router;
