/*
Module Name: Authentication Routes
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Express routing for user authentication including registration, login, profile access, validation middleware, and system status endpoints
*/
const express = require('express');
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');
const { authenticateToken, validateRegistration, validateLogin } = require('../middleware/authMiddleware');

const router = express.Router();

// Real authentication routes
router.post('/register', validateRegistration, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/profile', authenticateToken, getUserProfile);

// Test route
router.get('/status', (req, res) => {
  res.json({ message: 'Full auth system ready' });
});

module.exports = router;