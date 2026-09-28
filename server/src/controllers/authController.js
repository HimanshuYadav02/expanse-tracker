const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getIsMongoConnected } = require('../config/db');
const User = require('../models/User');
const dataStore = require('../config/dataStore');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecret_expense_tracker_jwt_key_2026_dev',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    if (getIsMongoConnected()) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        currency: currency || 'USD'
      });

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          token: generateToken(user._id)
        }
      });
    } else {
      const existing = dataStore.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = dataStore.createUser({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        currency: currency || 'USD'
      });

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          token: generateToken(user._id)
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    if (getIsMongoConnected()) {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          token: generateToken(user._id)
        }
      });
    } else {
      const user = dataStore.findUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          token: generateToken(user._id)
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: req.user
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
