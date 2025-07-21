'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAnalytics extends Model {
    static associate(models) {
      // UserAnalytics belongs to User
      UserAnalytics.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }

    // Calculate weekly average study time
    static async getWeeklyAverage(userId, endDate = new Date()) {
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);

      const analytics = await UserAnalytics.findAll({
        where: {
          userId,
          date: {
            [sequelize.Sequelize.Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
          }
        }
      });

      const totalMinutes = analytics.reduce((sum, day) => sum + day.totalStudyMinutes, 0);
      return Math.round(totalMinutes / 7);
    }

    // Get study analytics for a date range
    static async getAnalyticsRange(userId, startDate, endDate) {
      return await UserAnalytics.findAll({
        where: {
          userId,
          date: {
            [sequelize.Sequelize.Op.between]: [startDate, endDate]
          }
        },
        order: [['date', 'ASC']]
      });
    }

    // Calculate monthly stats
    static async getMonthlyStats(userId, year, month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const analytics = await UserAnalytics.getAnalyticsRange(
        userId, 
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const totalMinutes = analytics.reduce((sum, day) => sum + day.totalStudyMinutes, 0);
      const totalSessions = analytics.reduce((sum, day) => sum + day.sessionsCompleted, 0);
      const studyDays = analytics.filter(day => day.totalStudyMinutes > 0).length;
      const avgProductivity = analytics.length > 0 
        ? analytics.reduce((sum, day) => sum + (day.productivityAverage || 0), 0) / analytics.length
        : 0;

      return {
        totalStudyTime: totalMinutes,
        totalSessions,
        studyDays,
        averageProductivity: Math.round(avgProductivity * 100) / 100,
        averageDailyTime: studyDays > 0 ? Math.round(totalMinutes / studyDays) : 0
      };
    }

    // Update analytics for a completed session
    static async updateForSession(userId, sessionData) {
      const date = sessionData.startTime.toISOString().split('T')[0];
      
      const [analytics, created] = await UserAnalytics.findOrCreate({
        where: { userId, date },
        defaults: {
          userId,
          date,
          totalStudyMinutes: 0,
          sessionsCompleted: 0,
          sessionsScheduled: 0,
          subjectsStudied: [],
          productivityAverage: null,
          focusTimePercentage: null
        }
      });

      // Update analytics
      analytics.totalStudyMinutes += sessionData.durationMinutes;
      analytics.sessionsCompleted += 1;

      // Update subjects studied
      const subjectsStudied = analytics.subjectsStudied || [];
      if (!subjectsStudied.includes(sessionData.subjectId)) {
        subjectsStudied.push(sessionData.subjectId);
        analytics.subjectsStudied = subjectsStudied;
      }

      // Update productivity average if provided
      if (sessionData.productivityRating) {
        const currentAvg = analytics.productivityAverage || 0;
        const sessionCount = analytics.sessionsCompleted;
        analytics.productivityAverage = ((currentAvg * (sessionCount - 1)) + sessionData.productivityRating) / sessionCount;
      }

      await analytics.save();
      return analytics;
    }

    // Get productivity trend
    static async getProductivityTrend(userId, days = 30) {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);

      const analytics = await UserAnalytics.getAnalyticsRange(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      return analytics.map(day => ({
        date: day.date,
        studyTime: day.totalStudyMinutes,
        sessions: day.sessionsCompleted,
        productivity: day.productivityAverage,
        subjects: (day.subjectsStudied || []).length
      }));
    }

    // Get subject distribution
    static async getSubjectDistribution(userId, days = 30) {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);

      const analytics = await UserAnalytics.getAnalyticsRange(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const subjectCount = {};
      analytics.forEach(day => {
        if (day.subjectsStudied) {
          day.subjectsStudied.forEach(subjectId => {
            subjectCount[subjectId] = (subjectCount[subjectId] || 0) + day.totalStudyMinutes;
          });
        }
      });

      return subjectCount;
    }
  }

  UserAnalytics.init({
    analyticsId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    totalStudyMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_study_minutes',
      defaultValue: 0
    },
    sessionsCompleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sessions_completed',
      defaultValue: 0
    },
    sessionsScheduled: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sessions_scheduled',
      defaultValue: 0
    },
    subjectsStudied: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'subjects_studied'
    },
    productivityAverage: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      field: 'productivity_average',
      validate: {
        min: 0,
        max: 5
      }
    },
    focusTimePercentage: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      field: 'focus_time_percentage',
      validate: {
        min: 0,
        max: 100
      }
    }
  }, {
    sequelize,
    modelName: 'UserAnalytics',
    tableName: 'user_analytics',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'date']
      },
      {
        fields: ['date']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  return UserAnalytics;
};