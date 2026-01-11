const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const supabase = require('../db'); 
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Register a new user
 * Expects: email, password, full_name
 */
router.post('/register',
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 6 }), 
  body('full_name').optional().isString(),
  handleValidation,
  async (req, res) => {
    const { email, password, full_name } = req.body;

    try {
      // 1. Check if user already exists using the email column
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // 2. Insert into Supabase mapping to correct columns
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: email,       // Saves to email column
          password: password, // Plain text
          full_name: full_name // Saves to full_name column
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ 
        message: 'User registered successfully', 
        user_id: newUser.user_id, 
        email: newUser.email 
      });

    } catch (error) {
      console.error('Registration Error:', error.message);
      res.status(500).json({ error: 'Database insertion failed' });
    }
  }
);

/**
 * Login User
 * Expects: email, password
 */
router.post('/login',
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password').isString(),
  handleValidation,
  async (req, res) => {
    const { email, password } = req.body;

    try {
      // 1. Fetch user by email column
      const { data: user, error } = await supabase
        .from('users')
        .select('user_id, email, password, full_name')
        .eq('email', email)
        .single();

      // 2. Check if user exists and password matches
      if (error || !user || user.password !== password) {
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

    } catch (error) {
      console.error('Login Error:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = router;