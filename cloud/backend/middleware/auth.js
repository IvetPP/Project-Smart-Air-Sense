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

module.exports = { authMiddleware, JWT_SECRET };
