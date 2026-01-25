require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const devicesRoutes = require('./routes/devices');
const measurementsRoutes = require('./routes/measurements');
const thresholdsRoutes = require('./routes/thresholds');
const alertsRoutes = require('./routes/alerts');
const iotRoutes = require('./routes/iot');
const deviceUsersRoutes = require('./routes/device-users');

const app = express();
app.use(cors());
app.use(express.json());

/* =======================
   API ROUTES
======================= */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/thresholds', thresholdsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/device-users', deviceUsersRoutes);

app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    api_version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/* =======================
   API 404 HANDLER
======================= */
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

/* =======================
   FRONTEND (VITE BUILD)
======================= */
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Fix: Improved SPA routing and static file handling
app.get(/^\/(?!api).*/, (req, res) => {
    // Strip query parameters to check if the file exists on disk
    const cleanPath = req.path === '/' ? 'index.html' : req.path;
    const requestedPath = path.join(frontendPath, cleanPath);
    
    res.sendFile(requestedPath, (err) => {
        if (err) {
            // If file doesn't exist (like a refresh on a virtual route), serve index.html
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is booming on port ${PORT}`);
});