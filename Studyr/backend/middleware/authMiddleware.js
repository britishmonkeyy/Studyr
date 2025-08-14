/*
Module Name: Authentication Middleware
Module Author: Adam Bolton
Date Modified: 8/08/2025
Description: This modulates and checks if the user is currently logged in using a bearer token recieved when they login
*/
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Validate registration data
const validateRegistration = (req, res, next) => {
  const { firstName, lastName, email, username, password, studyLevel, dateOfBirth } = req.body;
  const errors = [];

  // Required fields
  if (!firstName?.trim()) errors.push('First name is required');
  if (!lastName?.trim()) errors.push('Last name is required');
  if (!email?.trim()) errors.push('Email is required');
  if (!username?.trim()) errors.push('Username is required');
  if (!password) errors.push('Password is required');
  if (!studyLevel) errors.push('Study level is required');
  if (!dateOfBirth) errors.push('Date of birth is required');

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Username validation
  if (username && (username.length < 3 || username.length > 25)) {
    errors.push('Username must be between 3 and 25 characters');
  }

  // Password validation
  if (password && password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Study level validation
  const validStudyLevels = ['high_school', 'university', 'professional'];
  if (studyLevel && !validStudyLevels.includes(studyLevel)) {
    errors.push('Invalid study level');
  }

  // Age validation (must be at least 13)
  if (dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      errors.push('You must be at least 13 years old to register');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Validate login data
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email?.trim()) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  validateRegistration,
  validateLogin
};