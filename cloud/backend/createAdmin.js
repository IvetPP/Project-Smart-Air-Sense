const db = require('./db/connection');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const email = 'admin@example.com';
const password = 'Password123!'; // the password you’ll use in Postman
const fullName = 'Admin User';
const roles = 'ROLE_ADMIN';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) return console.error(err);

  const userId = uuidv4();

  db.run(
    `INSERT INTO users (user_id, email, password_hash, full_name, roles, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
    [userId, email, hash, fullName, roles],
    function(err) {
      if (err) return console.error('Error inserting user:', err.message);
      console.log('Admin user created with email:', email);
      db.close();
    }
  );
});