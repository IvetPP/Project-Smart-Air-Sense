const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const db = require('../db/connection');

// POST new measurement
router.post('/', authMiddleware,
    body('device_id').isString(),
    body('metrics').isObject(),
    handleValidation,
    (req,res)=>{
        const { device_id, metrics } = req.body;
        db.get('SELECT device_id FROM devices WHERE device_id=?',[device_id],(err,row)=>{
            if(err) return res.status(500).json({ error:'DB error' });
            if(!row) return res.status(404).json({ error:'Device not found' });
            db.get('SELECT MAX(seq) as lastSeq FROM measurements WHERE device_id=?',[device_id],(err,row2)=>{
                const seq = (row2?.lastSeq || 0) + 1;
                db.run('INSERT INTO measurements(device_id,timestamp,seq,metrics) VALUES(?,?,?,?)',
                       [device_id,new Date().toISOString(),seq,JSON.stringify(metrics)],
                       err=>{
                          if(err) return res.status(500).json({ error:'DB error' });
                          res.status(201).json({ message:'Measurement added', seq });
                       });
            });
        });
});

// GET measurements (filter optional)
router.get('/', authMiddleware,
    query('device_id').optional().isString(),
    query('limit').optional().isInt({min:1,max:100}),
    handleValidation,
    (req,res)=>{
        const { device_id, limit } = req.query;
        let sql = 'SELECT * FROM measurements';
        let params = [];
        if(device_id){
            sql += ' WHERE device_id=?';
            params.push(device_id);
        }
        sql += ' ORDER BY timestamp DESC';
        if(limit) sql += ' LIMIT ?' , params.push(Number(limit));
        db.all(sql, params, (err,rows)=>{
            if(err) return res.status(500).json({ error:'DB error' });
            res.json(rows);
        });
});

// GET latest measurements for all devices
router.get('/latest', authMiddleware, (req,res)=>{
    const sql = `
        SELECT m.* FROM measurements m
        INNER JOIN (
            SELECT device_id, MAX(timestamp) as ts FROM measurements GROUP BY device_id
        ) as latest
        ON m.device_id=latest.device_id AND m.timestamp=latest.ts
    `;
    db.all(sql, [], (err,rows)=>{
        if(err) return res.status(500).json({ error:'DB error' });
        res.json(rows);
    });
});

module.exports = router;
