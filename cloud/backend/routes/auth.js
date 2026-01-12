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
  body('password').isLength({ min: 8 }), 
  body('full_name').optional().isString(),
  handleValidation,
  async (req, res) => {
    const { email, password, full_name } = req.body;

    try {
      // 1. Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // 2. Insert into Supabase
      // Note: We use .insert(). The database handles user_id automatically.
      const { data: insertedData, error: dbError } = await supabase
        .from('users')
        .insert([
          {
            email: email,
            user_name: email, 
            password: password, // Note: In production, use bcrypt to hash this!
            full_name: full_name
          }
        ])
        .select(); // Returns the created record

      if (dbError) {
        console.error('Supabase Insert Error:', dbError);
        throw dbError;
      }

      if (!insertedData || insertedData.length === 0) {
        throw new Error('No data returned after insertion');
      }

      const newUser = insertedData[0];

      res.status(201).json({ 
        message: 'User registered successfully', 
        user_id: newUser.user_id, 
        email: newUser.email 
      });

    } catch (err) {
      console.error('Registration Error:', err.message);
      res.status(500).json({ 
        error: 'Database insertion failed', 
        details: err.message 
      });
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
      // 1. Fetch user by email
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('user_id, email, password, full_name')
        .eq('email', email)
        .maybeSingle();

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