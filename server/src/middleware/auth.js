const jwt = require('jsonwebtoken');
const { getIsMongoConnected } = require('../config/db');
const User = require('../models/User');
const dataStore = require('../config/dataStore');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecret_expense_tracker_jwt_key_2026_dev'
      );

      if (getIsMongoConnected()) {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }
        req.user = user;
      } else {
        const user = dataStore.findUserById(decoded.id);
        if (!user) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }
        const { password, ...safeUser } = user;
        req.user = safeUser;
      }

      next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
