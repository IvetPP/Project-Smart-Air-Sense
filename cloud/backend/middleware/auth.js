const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing token' });

  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // IMPORTANT: normalize roles into array
    payload.roles = payload.roles
      ? payload.roles.split(',').map(r => r.trim())
      : [];

    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function roleMiddleware(roles) {
  return (req, res, next) => {
    if (!roles.some(r => req.user.roles.includes(r))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware, JWT_SECRET };
