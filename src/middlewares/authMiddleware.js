const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication token not provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.sub,
      email: payload.email
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
}

module.exports = authMiddleware;
