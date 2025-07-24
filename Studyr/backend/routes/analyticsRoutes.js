const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getUserAnalytics,
  getStreakStats,
  getGoalProgress,
  updateSessionAnalytics,
  getDashboardSummary
} = require('../controllers/analyticsController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/analytics - Get comprehensive user analytics
router.get('/', getUserAnalytics);

// GET /api/analytics/dashboard - Get dashboard summary
router.get('/dashboard', getDashboardSummary);

// GET /api/analytics/streak - Get streak statistics
router.get('/streak', getStreakStats);

// GET /api/analytics/goals - Get goal progress
router.get('/goals', getGoalProgress);

// POST /api/analytics/session/:sessionId - Update analytics after session completion
router.post('/session/:sessionId', updateSessionAnalytics);

module.exports = router;