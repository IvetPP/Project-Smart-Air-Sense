const express = require('express');
const cors = require('cors');
const path = require('path');
const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const devicesRoutes = require('./routes/devices');
const measurementsRoutes = require('./routes/measurements');
const thresholdsRoutes = require('./routes/thresholds');
const alertsRoutes = require('./routes/alerts');

const app = express();
app.use(cors());
app.use(express.json());

// --- API routes ---
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/thresholds', thresholdsRoutes);
app.use('/api/alerts', alertsRoutes);

app.get('/api/status', (req,res) => {
  res.json({ status:'OK', api_version:'1.0.0', timestamp: new Date().toISOString() });
});

// --- Serve React frontend ---
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Fallback: for any route not starting with /api, serve index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Catch-all for unmatched API routes
app.use((req,res)=>res.status(404).json({ error:'Endpoint not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server listening on port ${PORT}`));