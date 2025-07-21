const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getUserAnalytics,
  getStreakStats,
  getWeeklyComparison,
  getInsights,
  getGoalProgress,
  updateSessionAnalytics,
  exportUserData,
  getDashboardSummary,
  getProductivityTrends,
  getSubjectAnalytics
} = require('../controllers/analyticsController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/analytics - Get comprehensive user analytics
router.get('/', getUserAnalytics);

// GET /api/analytics/dashboard - Get dashboard summary
router.get('/dashboard', getDashboardSummary);

// GET /api/analytics/streak - Get streak statistics
router.get('/streak', getStreakStats);

// GET /api/analytics/weekly - Get weekly comparison
router.get('/weekly', getWeeklyComparison);

// GET /api/analytics/insights - Get insights and recommendations
router.get('/insights', getInsights);

// GET /api/analytics/goals - Get goal progress
router.get('/goals', getGoalProgress);

// GET /api/analytics/trends - Get productivity trends
router.get('/trends', getProductivityTrends);

// GET /api/analytics/subjects - Get subject analytics
router.get('/subjects', getSubjectAnalytics);

// POST /api/analytics/session/:sessionId - Update analytics after session completion
router.post('/session/:sessionId', updateSessionAnalytics);

// GET /api/analytics/export - Export user data
router.get('/export', exportUserData);

module.exports = router;