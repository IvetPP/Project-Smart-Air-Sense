const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware, roleMiddleware } = require('../middleware/auth'); 
const { handleValidation } = require('../middleware/validation');
const db = require('../db/connection');
const { v4: uuidv4 } = require('uuid');

// Helper function to check ownership or admin status (Used for GET /:id and PUT /:id/status)
const checkOwnershipOrAdmin = (req, res, next) => {
    const userId = req.user.sub;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
    const isAdminOrOwner = userRoles.some(role => ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(role));
    const deviceId = req.params.device_id;
    
    // Admins/Owners can proceed immediately
    if (isAdminOrOwner) return next();

    // Logged-In User must own the device
    db.get('SELECT owner_id FROM devices WHERE device_id=?', [deviceId], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(404).json({ error: 'Device not found' });
        
        // Check if the current user is the owner
        if (row.owner_id === userId) {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden: You do not own this device' });
        }
    });
};

// 5. devices/list (GET) - Dynamic Logic
// Admin/Owner sees ALL devices. Logged-In User sees only THEIR devices.
router.get('/', authMiddleware, (req,res)=>{
    const userId = req.user.sub;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];

    const isAdminOrOwner = userRoles.some(role => ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(role));
    
    let sql = 'SELECT * FROM devices';
    let params = [];
    
    // Filter by owner_id if the user is not an Admin/Owner
    if (!isAdminOrOwner) {
        sql += ' WHERE owner_id=?'; 
        params.push(userId); 
    }
    
    db.all(sql, params, (err,rows)=>{
        if(err) return res.status(500).json({ error: 'DB error' });
        res.json(rows);
    });
});

// 6. devices/create (POST) - All logged-in users are allowed, must link to creator
router.post('/', authMiddleware,
    body('name').isString(),
    body('type').isString(),
    body('location').optional().isString(),
    handleValidation,
    (req,res)=>{
        const { name,type,location } = req.body;
        const ownerId = req.user.sub; // Get the user ID from the token
        const deviceId = uuidv4();
        
        db.run(`INSERT INTO devices(device_id,name,type,location,status,owner_id,metadata,created_at,last_seen) 
                 VALUES(?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
                [deviceId,name,type,location||null,'OFF', ownerId, '{}'],
                err=>{
                    if(err) return res.status(500).json({ error:'DB error' });
                    // Note: In a real app, you'd also insert into the user_devices table here.
                    res.status(201).json({ device_id:deviceId, owner_id:ownerId });
                });
});

// 7. devices/get (GET /:device_id) - Check Ownership or Admin status
router.get('/:device_id', authMiddleware, checkOwnershipOrAdmin, (req,res)=>{
    const id = req.params.device_id;
    // Ownership/Admin status already confirmed by checkOwnershipOrAdmin
    db.get('SELECT * FROM devices WHERE device_id=?',[id],(err,row)=>{
        if(err) return res.status(500).json({ error:'DB error' });
        if(!row) return res.status(404).json({ error:'Device not found' }); 
        res.json(row);
    });
});

// 8. devices/update (PUT /:device_id) - Granular Authorization for Update
router.put('/:device_id', authMiddleware,
    body('name').optional().isString(),
    body('location').optional().isString(),
    body('status').optional().isIn(['ON','OFF','ER']),
    handleValidation,
    (req,res)=>{
        const userId = req.user.sub;
        const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
        const isAdminOrOwner = userRoles.some(role => ['ROLE_ADMIN', 'ROLE_LICENSE_OWNER'].includes(role));
        const { name, location, status } = req.body;
        const id = req.params.device_id;
        
        // Step 1: Check device existence and ownership
        db.get('SELECT owner_id FROM devices WHERE device_id=?', [id], (err, row) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            if (!row) return res.status(404).json({ error: 'Device not found' });
            
            const isOwner = row.owner_id === userId;
            
            // Step 2: Determine allowed actions
            let updateSql = `UPDATE devices SET last_seen=datetime('now')`;
            let updateParams = [];
            let allowed = false;

            if (isAdminOrOwner) {
                // Admin/License Owner: Can update all fields
                updateSql += `, name = COALESCE(?, name), location = COALESCE(?, location), status = COALESCE(?, status)`;
                updateParams.push(name, location, status);
                allowed = true;
            } else if (isOwner && name && !location && !status) {
                // Device Owner: Can only update name
                updateSql += `, name = COALESCE(?, name)`;
                updateParams.push(name);
                allowed = true;
            } else if (isOwner && (location || status)) {
                // Device Owner attempting to update restricted fields
                return res.status(403).json({ error: 'Forbidden: You can only edit the device name.' });
            }

            if (!allowed) {
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
            }

            // Step 3: Execute update
            updateParams.push(id);
            updateSql += ` WHERE device_id=?`;

            db.run(updateSql, updateParams, function(err){
                if(err) return res.status(500).json({ error:'DB error' });
                if(this.changes===0) return res.status(404).json({ error:'Device not found' });
                res.json({ message:'Device updated' });
            });
        });
});

// 9. devices/status/get (GET /:device_id/status) - Check Ownership or Admin status
router.get('/:device_id/status', authMiddleware, checkOwnershipOrAdmin, (req,res)=>{
    const id = req.params.device_id;
    db.get('SELECT status,last_seen FROM devices WHERE device_id=?',[id],(err,row)=>{
        if(err) return res.status(500).json({ error:'DB error' });
        if(!row) return res.status(404).json({ error:'Device not found' });
        res.json(row);
    });
});

// 10. devices/status/set (PUT /:device_id/status) - Check Ownership or Admin status
router.put('/:device_id/status', authMiddleware, checkOwnershipOrAdmin,
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