const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const db = require('../db/connection');

// GET thresholds
router.get('/', authMiddleware, (req,res)=>{
    db.all('SELECT * FROM thresholds', [], (err,rows)=>{
        if(err) return res.status(500).json({ error:'DB error' });
        res.json(rows);
    });
});

// POST save/update thresholds
router.post('/', authMiddleware,
    body('scope').isString(),
    body('device_id').optional().isString(),
    body('thresholds').isObject(),
    handleValidation,
    (req,res)=>{
        const { scope, device_id, thresholds } = req.body;
        const t = JSON.stringify(thresholds);
        db.get('SELECT id FROM thresholds WHERE scope=? AND device_id IS ?',[scope, device_id || null],(err,row)=>{
            if(err) return res.status(500).json({ error:'DB error' });
            if(row){
                db.run('UPDATE thresholds SET thresholds=?, updated_at=datetime("now") WHERE id=?',[t,row.id], err=>{
                    if(err) return res.status(500).json({ error:'DB error' });
                    res.json({ message:'Threshold updated' });
                });
            } else {
                db.run('INSERT INTO thresholds(scope,device_id,thresholds,updated_at) VALUES(?,?,?,datetime("now"))',
                        [scope, device_id || null, t], err=>{
                    if(err) return res.status(500).json({ error:'DB error' });
                    res.status(201).json({ message:'Threshold created' });
                });
            }
        });
    }
);

module.exports = router;
