const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const db = require('../db/connection');
const { v4: uuidv4 } = require('uuid');

// GET all devices
router.get('/', authMiddleware, (req,res)=>{
    db.all('SELECT * FROM devices', [], (err,rows)=>{
        if(err) return res.status(500).json({ error: 'DB error' });
        res.json(rows);
    });
});

// POST add new device
router.post('/', authMiddleware,
    body('name').isString(),
    body('type').isString(),
    body('location').optional().isString(),
    handleValidation,
    (req,res)=>{
        const { name,type,location } = req.body;
        const deviceId = uuidv4();
        db.run(`INSERT INTO devices(device_id,name,type,location,status,metadata,created_at,last_seen)
                VALUES(?,?,?,?,?,'{}',datetime('now'),datetime('now'))`,
                [deviceId,name,type,location||null,'OFF'],
                err=>{
                    if(err) return res.status(500).json({ error:'DB error' });
                    res.status(201).json({ device_id:deviceId });
                });
});

// GET device by id
router.get('/:device_id', authMiddleware, (req,res)=>{
    const id = req.params.device_id;
    db.get('SELECT * FROM devices WHERE device_id=?',[id],(err,row)=>{
        if(err) return res.status(500).json({ error:'DB error' });
        if(!row) return res.status(404).json({ error:'Device not found' });
        res.json(row);
    });
});

// PUT update device
router.put('/:device_id', authMiddleware,
    body('name').optional().isString(),
    body('location').optional().isString(),
    body('status').optional().isIn(['ON','OFF','ER']),
    handleValidation,
    (req,res)=>{
        const id = req.params.device_id;
        const { name, location, status } = req.body;
        db.run(`UPDATE devices SET 
                name = COALESCE(?, name),
                location = COALESCE(?, location),
                status = COALESCE(?, status),
                last_seen=datetime('now')
                WHERE device_id=?`,
                [name, location, status, id],
                function(err){
                    if(err) return res.status(500).json({ error:'DB error' });
                    if(this.changes===0) return res.status(404).json({ error:'Device not found' });
                    res.json({ message:'Device updated' });
                });
});

// GET device status
router.get('/:device_id/status', authMiddleware, (req,res)=>{
    const id = req.params.device_id;
    db.get('SELECT status,last_seen FROM devices WHERE device_id=?',[id],(err,row)=>{
        if(err) return res.status(500).json({ error:'DB error' });
        if(!row) return res.status(404).json({ error:'Device not found' });
        res.json(row);
    });
});

// PUT update device status
router.put('/:device_id/status', authMiddleware,
    body('status').isIn(['ON','OFF','ER']),
    handleValidation,
    (req,res)=>{
        const id = req.params.device_id;
        const { status } = req.body;
        db.run('UPDATE devices SET status=?, last_seen=datetime("now") WHERE device_id=?',[status,id], function(err){
            if(err) return res.status(500).json({ error:'DB error' });
            if(this.changes===0) return res.status(404).json({ error:'Device not found' });
            res.json({ message:'Status updated' });
        });
});

module.exports = router;
