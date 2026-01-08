const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const supabase = require('../db'); 
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Register a new user
 * Expects: user_name, password
 */
router.post('/register',
  body('user_name').isString().notEmpty(),
  body('password').isLength({ min: 6 }), // Adjusted for development ease
  handleValidation,
  async (req, res) => {
    const { user_name, password } = req.body;

    try {
      // 1. Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_name', user_name)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // 2. Insert into Supabase (user_id will auto-increment from 1)
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          user_name: user_name,
          password: password // Plain text as requested
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ 
        message: 'User registered successfully', 
        user_id: newUser.user_id, 
        user_name: newUser.user_name 
      });

    } catch (error) {
      console.error('Registration Error:', error.message);
      res.status(500).json({ error: 'Database insertion failed' });
    }
  }
);

/**
 * Login User
 * Expects: user_name, password
 */
router.post('/login',
  body('user_name').isString().notEmpty(),
  body('password').isString(),
  handleValidation,
  async (req, res) => {
    const { user_name, password } = req.body;

    try {
      // 1. Fetch user by user_name
      const { data: user, error } = await supabase
        .from('users')
        .select('user_id, user_name, password')
        .eq('user_name', user_name)
        .single();

      // 2. Check if user exists and password matches
      if (error || !user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 3. Generate JWT Token
      // 'sub' is set to the integer user_id
      const token = jwt.sign(
        { sub: user.user_id, username: user.user_name }, 
        JWT_SECRET, 
        { expiresIn: '2h' }
      );

      res.json({ 
        token, 
        token_type: 'Bearer', 
        expires_in: 7200,
        username: user.user_name 
      });

    } catch (error) {
      console.error('Login Error:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = router;