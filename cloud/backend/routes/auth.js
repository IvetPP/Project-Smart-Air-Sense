const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const supabase = require('../db'); // Corrected import
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Register
router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  handleValidation,
  async (req, res) => {
    const { email, password, full_name } = req.body;

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) return res.status(409).json({ error: 'Email exists' });

    const hash = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    const { error } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email,
        password_hash: hash,
        full_name: full_name || null,
        roles: 'ROLE_USER'
      });

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ user_id: userId, email });
  }
);

// Login
router.post('/login',
  body('email').isEmail(),
  body('password').isString(),
  handleValidation,
  async (req, res) => {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, password_hash, roles')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: user.user_id, roles: user.roles }, JWT_SECRET, {
      expiresIn: '2h',
    });

    res.json({ token, token_type: 'Bearer', expires_in: 7200 });
  }
);

module.exports = router;