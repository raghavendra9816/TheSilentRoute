const User = require('../models/User');
const jwt  = require('jsonwebtoken');

// =============================================
// GENERATE JWT TOKEN
// =============================================
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// =============================================
// REGISTER
// =============================================
const register = async (req, res) => {
  try {
    const { username, email, password, adminKey } = req.body;

    // Check required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.trim() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase().trim()
          ? 'Email already registered. Please login.'
          : 'Username already taken. Please choose another.'
      });
    }

    // Set role
    let role = 'user';
    if (adminKey && adminKey === process.env.ADMIN_SECRET_KEY) {
      role = 'admin';
    }

    // Hash password manually here
    // Do NOT rely on pre-save hook to avoid next() issues
    const bcrypt = require('bcryptjs');
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with already hashed password
    const user = await User.create({
      username: username.trim(),
      email:    email.toLowerCase().trim(),
      password: hashedPassword,
      role:     role
    });

    // Generate token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: `Welcome to The Silent Route, ${user.username}!`,
      token,
      user: {
        id:            user._id,
        username:      user.username,
        email:         user.email,
        role:          user.role,
        downloadCount: user.downloadCount,
        createdAt:     user.createdAt
      }
    });

  } catch (error) {
    console.error('Register Error:', error.message);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `This ${field} is already registered.`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error:   error.message
    });
  }
};

// =============================================
// LOGIN
// =============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    // Find user with password
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated.'
      });
    }

    // Compare password manually
    const bcrypt          = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date()
    });

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token,
      user: {
        id:            user._id,
        username:      user.username,
        email:         user.email,
        role:          user.role,
        downloadCount: user.downloadCount,
        lastLogin:     new Date()
      }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error:   error.message
    });
  }
};

// =============================================
// GET CURRENT USER
// =============================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id:            user._id,
        username:      user.username,
        email:         user.email,
        role:          user.role,
        downloadCount: user.downloadCount,
        bio:           user.bio,
        createdAt:     user.createdAt,
        lastLogin:     user.lastLogin
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// UPDATE PROFILE
// =============================================
const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, bio },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// EXPORTS
// =============================================
module.exports = {
  register,
  login,
  getMe,
  updateProfile
};