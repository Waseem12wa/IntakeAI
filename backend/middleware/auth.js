// Authentication middleware to extract user ID from token
const User = require('../models/User');

// Middleware to authenticate user and extract user ID
const authenticateUser = async (req, res, next) => {
  try {
    // Safely get headers
    const headers = req.headers || {};

    // Get token from Authorization header or x-auth-token header
    const token = headers.authorization?.replace('Bearer ', '') ||
      headers['x-auth-token'] ||
      (req.body && req.body.token) ||
      (req.query && req.query.token);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please login.'
      });
    }

    // Decode the token (format: base64(userId:timestamp))
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, timestamp] = decoded.split(':');

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format.'
        });
      }

      // FALLBACK for Admin
      if (userId === '000000000000000000000000') {
        req.user = {
          id: userId,
          _id: userId,
          email: 'admin@intake.ai',
          role: 'admin'
        };
        return next();
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found. Please login again.'
        });
      }

      // Attach user info to request
      req.user = {
        id: user._id.toString(),
        email: user.email,
        _id: user._id
      };

      next();
    } catch (decodeError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please login again.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error.'
    });
  }
};

// Optional authentication - doesn't fail if no token, but adds user if token exists
const optionalAuth = async (req, res, next) => {
  try {
    const headers = req.headers || {};
    const token = headers.authorization?.replace('Bearer ', '') ||
      headers['x-auth-token'] ||
      (req.body && req.body.token) ||
      (req.query && req.query.token);

    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId] = decoded.split(':');

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            req.user = {
              id: user._id.toString(),
              email: user.email,
              _id: user._id
            };
          }
        }
      } catch (err) {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    // Continue even if auth fails for optional auth
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth
};
