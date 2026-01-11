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

// 1. Try to serve the specific file if it exists (e.g., /editUser.html)
// 2. If it's an API route, do nothing here (it's handled above)
// 3. ONLY if the file doesn't exist and it's not an API, send index.html
app.get(/^\/(?!api).*/, (req, res) => {
    const requestedPath = path.join(frontendPath, req.path);
    
    // Check if the requested file (like editUser.html) actually exists
    res.sendFile(requestedPath, (err) => {
        if (err) {
            // If file doesn't exist, fall back to index.html (SPA routing)
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));