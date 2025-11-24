const jwt = require('jsonwebtoken');
const JWT_SECRET = 'change_this_secret_in_production';

function authMiddleware(req, res, next) {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing token' });

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}


function roleMiddleware(requiredRoles) {
    return (req, res, next) => {
        // The role(s) are extracted from the JWT payload by authMiddleware
        const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];

        const hasRole = userRoles.some(role => requiredRoles.includes(role));

        if (hasRole) {
            next();
        } else {
            // Use 403 Forbidden for insufficient permissions
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
    };
}

// Add the new function to the exports
module.exports = { authMiddleware, roleMiddleware, JWT_SECRET }; 