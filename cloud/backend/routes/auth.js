const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const supabase = require('../db'); 
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Register a new user
 */
router.post('/register',
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 8 }), // Matched your frontend 8+ char regex
  body('full_name').optional().isString(),
  handleValidation,
  async (req, res) => {
    const { email, password, full_name } = req.body;

    try {
      // 1. Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle(); // Better than .single() as it doesn't throw error if 0 rows

      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // 2. Insert into Supabase
      // Note: We do NOT send 'user_id'. The database handles it now.
      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert({
          email: email,
          user_name: email, 
          password: password, // Note: In production, hash this with bcrypt!
          full_name: full_name
        })
        .select()
        .single();

      if (dbError) throw dbError;

      res.status(201).json({ 
        message: 'User registered successfully', 
        user_id: newUser.user_id, 
        email: newUser.email 
      });

    } catch (err) {
      console.error('Registration Error:', err.message);
      // Detailed error for debugging
      res.status(500).json({ error: 'Database insertion failed', details: err.message });
    }
  }
);

/**
 * Login User
 */
router.post('/login',
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password').isString(),
  handleValidation,
  async (req, res) => {
    const { email, password } = req.body;

    try {
      // 1. Fetch user by email - Renamed 'error' to 'fetchError'
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('user_id, email, password, full_name')
        .eq('email', email)
        .single();

      // 2. Check if user exists and password matches
      if (fetchError || !user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 3. Generate JWT Token
      const token = jwt.sign(
        { sub: user.user_id, email: user.email, name: user.full_name }, 
        JWT_SECRET, 
        { expiresIn: '2h' }
      );

      res.json({ 
        token, 
        token_type: 'Bearer', 
        expires_in: 7200,
        email: user.email,
        full_name: user.full_name
      });

    } catch (err) {
      console.error('Login Error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = router;