// BalanceVault Authentication Middleware
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { db } = require('../config/db');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. Missing or invalid Authorization Bearer header.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await db.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'The token belongs to an unrecognized or deleted user.'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Account Suspended',
        message: 'This account has been suspended by an administrator.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Signature verification failed or session expired. Please re-login.'
    });
  }
};

module.exports = { authenticateJWT };

