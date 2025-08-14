/*
Module Name: Analytics Controller
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Handles analytics endpoints including user statistics, streak tracking, goal progress monitoring, and dashboard data aggregation for study session analytics
*/
const AnalyticsService = require('../services/analyticsService');

// Get comprehensive user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { timeframe = '30days' } = req.query;
    
    const stats = await AnalyticsService.getUserStats(req.user.userId, timeframe);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get streak information
const getStreakStats = async (req, res) => {
  try {
    const streakStats = await AnalyticsService.getStreakStats(req.user.userId);
    
    res.json({
      success: true,
      data: { streak: streakStats }
    });
  } catch (error) {
    console.error('Error fetching streak stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get goal progress
const getGoalProgress = async (req, res) => {
  try {
    const { goalType = 'weekly', targetValue } = req.query;
    
    const progress = await AnalyticsService.getGoalProgress(
      req.user.userId,
      goalType,
      targetValue ? parseInt(targetValue) : null
    );
    
    res.json({
      success: true,
      data: { progress }
    });
  } catch (error) {
    console.error('Error fetching goal progress:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update analytics when session is completed
const updateSessionAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await AnalyticsService.updateAnalyticsForCompletedSession(req.user.userId, sessionId);
    
    res.json({
      success: true,
      message: 'Analytics updated successfully'
    });
  } catch (error) {
    console.error('Error updating session analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get dashboard summary (combines multiple analytics)
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [stats, goalProgress] = await Promise.all([
      AnalyticsService.getUserStats(userId, '30days'),
      AnalyticsService.getGoalProgress(userId, 'weekly')
    ]);
    
    res.json({
      success: true,
      data: {
        stats,
        goalProgress
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getUserAnalytics,
  getStreakStats,
  getGoalProgress,
  updateSessionAnalytics,
  getDashboardSummary
};