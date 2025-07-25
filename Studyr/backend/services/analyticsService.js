const { StudyStreak, UserAnalytics, StudySession, Subject } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
  
  // Update all analytics when a session is completed
  static async updateAnalyticsForCompletedSession(userId, sessionId) {
    try {
      // Get the completed session
      const session = await StudySession.findByPk(sessionId, {
        include: ['subject']
      });

      if (!session || session.status !== 'completed') {
        throw new Error('Session not found or not completed');
      }

      // Update study streak
      await this.updateStudyStreak(userId, session.durationMinutes);

      // Update daily analytics
      await this.updateDailyAnalytics(userId, session);

      return { success: true };
    } catch (error) {
      console.error('Error updating analytics:', error);
      throw error;
    }
  }

  // Update study streak
  static async updateStudyStreak(userId, sessionDurationMinutes) {
    let streak = await StudyStreak.findOne({ where: { userId } });

    if (!streak) {
      // Create new streak record
      streak = await StudyStreak.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalStudyTime: 0
      });
    }

    await streak.updateForCompletedSession(sessionDurationMinutes);
    return streak;
  }

  // Update daily analytics
  static async updateDailyAnalytics(userId, session) {
    const sessionData = {
      startTime: new Date(session.startTime),
      durationMinutes: session.durationMinutes,
      subjectId: session.subjectId,
      productivityRating: session.productivityRating || null
    };

    return await UserAnalytics.updateForSession(userId, sessionData);
  }

  // Get comprehensive user stats
  static async getUserStats(userId, timeframe = '30days') {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const [streak, analytics, sessions] = await Promise.all([
      this.getStreakStats(userId),
      this.getAnalyticsSummary(userId, startDate, endDate),
      this.getSessionStats(userId, startDate, endDate)
    ]);

    return {
      timeframe,
      streak,
      analytics,
      sessions,
      generatedAt: new Date()
    };
  }

  // Get streak statistics
  static async getStreakStats(userId) {
    const streak = await StudyStreak.findOne({ where: { userId } });
    
    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalStudyTime: 0,
        status: 'no_streak',
        message: 'Start your first streak!',
        nextMilestone: 7,
        milestoneProgress: 0
      };
    }

    const status = streak.getStreakStatus();
    
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalStudyTime: streak.totalStudyTime,
      ...status,
      nextMilestone: streak.getNextMilestone(),
      milestoneProgress: streak.getMilestoneProgress()
    };
  }

  // Get analytics summary for date range
  static async getAnalyticsSummary(userId, startDate, endDate) {
    const analytics = await UserAnalytics.getAnalyticsRange(
      userId, 
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalStudyTime = analytics.reduce((sum, day) => sum + day.totalStudyMinutes, 0);
    const totalSessions = analytics.reduce((sum, day) => sum + day.sessionsCompleted, 0);
    const studyDays = analytics.filter(day => day.totalStudyMinutes > 0).length;
    
    const averageProductivity = analytics.length > 0 
      ? analytics.reduce((sum, day) => sum + (day.productivityAverage || 0), 0) / analytics.filter(day => day.productivityAverage).length
      : 0;

    // Get subject distribution
    const subjectDistribution = await UserAnalytics.getSubjectDistribution(userId, totalDays);

    return {
      totalStudyTime,
      averageDailyTime: studyDays > 0 ? Math.round(totalStudyTime / studyDays) : 0,
      totalSessions,
      studyDays,
      studyDaysPercentage: Math.round((studyDays / totalDays) * 100),
      averageProductivity: Math.round(averageProductivity * 100) / 100,
      subjectDistribution,
      trend: await UserAnalytics.getProductivityTrend(userId, totalDays)
    };
  }

  // Get session statistics
  static async getSessionStats(userId, startDate, endDate) {
    const sessions = await StudySession.findAll({
      where: {
        userId,
        startTime: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Subject,
        as: 'subject',
        attributes: ['subjectName', 'colorHex', 'category']
      }]
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const cancelledSessions = sessions.filter(s => s.status === 'cancelled');
    const completionRate = totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0;

    // Session type distribution
    const sessionTypes = {
      solo: sessions.filter(s => s.sessionType === 'solo').length,
      partner: sessions.filter(s => s.sessionType === 'partner').length,
      group: sessions.filter(s => s.sessionType === 'group').length
    };

    // Average session length
    const avgSessionLength = completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / completedSessions.length)
      : 0;

    // Most studied subjects
    const subjectStats = {};
    completedSessions.forEach(session => {
      const subjectId = session.subjectId;
      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = {
          subjectName: session.subject?.subjectName || 'Unknown',
          colorHex: session.subject?.colorHex || '#4ECDC4',
          sessionCount: 0,
          totalMinutes: 0
        };
      }
      subjectStats[subjectId].sessionCount++;
      subjectStats[subjectId].totalMinutes += session.durationMinutes;
    });

    const topSubjects = Object.values(subjectStats)
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 5);

    return {
      totalSessions,
      completedSessions: completedSessions.length,
      cancelledSessions: cancelledSessions.length,
      completionRate,
      avgSessionLength,
      sessionTypes,
      topSubjects
    };
  }

  // Get goal progress (weekly goal tracking)
  static async getGoalProgress(userId, goalType = 'weekly', targetValue = null) {
    const goals = {
      weekly: {
        target: targetValue || 15 * 60, // 15 hours in minutes
        period: 7,
        label: 'Weekly Study Goal'
      },
      daily: {
        target: targetValue || 2 * 60, // 2 hours in minutes
        period: 1,
        label: 'Daily Study Goal'
      }
    };

    const goal = goals[goalType];
    if (!goal) throw new Error('Invalid goal type');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - goal.period);

    const analytics = await UserAnalytics.getAnalyticsRange(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const totalStudyTime = analytics.reduce((sum, day) => sum + day.totalStudyMinutes, 0);
    const progress = Math.min((totalStudyTime / goal.target) * 100, 100);
    const remaining = Math.max(goal.target - totalStudyTime, 0);

    return {
      goalType,
      target: goal.target,
      current: totalStudyTime,
      progress: Math.round(progress),
      remaining,
      label: goal.label,
      achieved: progress >= 100
    };
  }
}

module.exports = AnalyticsService;