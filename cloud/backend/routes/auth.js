const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Register
router.post(
  '/register',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  handleValidation,
  async (req, res) => {
    const { email, password, full_name } = req.body;

    db.get('SELECT user_id FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (row) return res.status(409).json({ error: 'Email exists' });

      const hash = bcrypt.hashSync(password, 10);
      const roles = 'user';

      db.run(
        `INSERT INTO users(user_id, email, password_hash, full_name, roles, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [require('uuid').v4(), email, hash, full_name || null, roles],
        function (err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ user_id: this.lastID, email });
        }
      );
    });
  }
);

// Login
router.post(
  '/login',
  body('email').isEmail(),
  body('password').isString(),
  handleValidation,
  async (req, res) => {
    const { email, password } = req.body;

    db.get(
      'SELECT user_id, password_hash, roles FROM users WHERE email = ?',
      [email],
      (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: err.message });
        }
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = bcrypt.compareSync(password, row.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ sub: row.user_id, roles: row.roles }, JWT_SECRET, {
          expiresIn: '2h',
        });

        res.json({ token, token_type: 'Bearer', expires_in: 7200 });
      }
    );
  }
);

module.exports = router;