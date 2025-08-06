// /middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super_secret_jwt_key_change_in_env'; // Move to env

// Alias authenticateJWT as authenticate for backward compatibility
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Keep the original name for backward compatibility
export const authenticateJWT = authenticate;

export const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
};

export { JWT_SECRET };
