const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../db/connection');

// profile
router.get('/profile', authMiddleware, (req,res)=>{
  db.get(
    'SELECT user_id,email,full_name,roles,created_at FROM users WHERE user_id=?',
    [req.user.sub],
    (err,row)=>{
      if(!row) return res.status(404).json({ error:'User not found' });
      res.json(row);
    }
  );
});

// list users
router.get('/',
  authMiddleware,
  roleMiddleware(['ROLE_ADMIN','ROLE_LICENSE_OWNER']),
  (req,res)=>{
    db.all(
      'SELECT user_id,email,full_name,roles,status,created_at FROM users',
      [],
      (err,rows)=>res.json(rows)
    );
  }
);

// update user
router.put('/:user_id',
  authMiddleware,
  roleMiddleware(['ROLE_ADMIN','ROLE_LICENSE_OWNER']),
  (req,res)=>{
    const { full_name, roles, status } = req.body;
    db.run(
      `UPDATE users SET
        full_name=COALESCE(?,full_name),
        roles=COALESCE(?,roles),
        status=COALESCE(?,status)
       WHERE user_id=?`,
      [full_name, roles, status, req.params.user_id],
      function(){
        res.json({ updated:this.changes });
      }
    );
  }
);

// soft delete
router.delete('/:user_id',
  authMiddleware,
  roleMiddleware(['ROLE_ADMIN','ROLE_LICENSE_OWNER']),
  (req,res)=>{
    db.run(
      'UPDATE users SET status="DISABLED" WHERE user_id=?',
      [req.params.user_id],
      function(){
        res.json({ disabled:this.changes });
      }
    );
  }
);

module.exports = router;
