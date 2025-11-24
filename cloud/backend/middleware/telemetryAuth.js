const TELEMETRY_API_KEY = process.env.TELEMETRY_API_KEY || 'default-secret-key'; // Use a robust default or enforce env var

const telemetryAuth = (req, res, next) => {
    // 1. Get the key from a custom header (e.g., X-API-Key)
    const apiKey = req.header('X-API-Key');

    // 2. Check if the key is present and matches the configured secret
    if (!apiKey || apiKey !== TELEMETRY_API_KEY) {
        // Use 401 Unauthorized for missing/incorrect credentials
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }

    // 3. Key is valid, proceed to the route handler
    next();
};

module.exports = { telemetryAuth };