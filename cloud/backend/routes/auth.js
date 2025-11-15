// /routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET } = require('../middleware/auth');

// Register
router.post('/register',
  body('email').isEmail(),
  body('password').isLength({min:8}),
  handleValidation,
  async (req,res)=>{
    const { email, password, full_name } = req.body;
    db.get('SELECT user_id FROM users WHERE email=?',[email], (err,row)=>{
      if(row) return res.status(409).json({error:'Email exists'});
      const userId = uuidv4();
      const hash = bcrypt.hashSync(password,10);
      db.run(`INSERT INTO users(user_id,email,password_hash,full_name,roles,created_at)
              VALUES(?,?,?,?,?,datetime('now'))`,
              [userId,email,hash,full_name||null,'user']);
      res.status(201).json({ user_id:userId, email });
    });
  }
);

// Login
router.post('/login',
  body('email').isEmail(),
  body('password').isString(),
  handleValidation,
  async (req,res)=>{
    const { email, password } = req.body;
    db.get('SELECT user_id,password_hash,roles FROM users WHERE email=?',[email], (err,row)=>{
      if(!row) return res.status(401).json({ error:'Invalid credentials' });
      const ok = bcrypt.compareSync(password,row.password_hash);
      if(!ok) return res.status(401).json({ error:'Invalid credentials' });
      const token = jwt.sign({ sub: row.user_id, roles: row.roles }, JWT_SECRET, { expiresIn:'2h' });
      res.json({ token, token_type:'Bearer', expires_in:7200 });
    });
  }
);

module.exports = router;
