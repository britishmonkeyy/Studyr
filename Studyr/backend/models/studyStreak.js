/*
Module Name: Study Streak Model
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Sequelize model for tracking user study streaks including current/longest streak calculation, milestone tracking, and total study time accumulation
*/
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudyStreak extends Model {
    static associate(models) {
      // StudyStreak belongs to User
      StudyStreak.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }

    // Calculate if streak is still active
    isStreakActive() {
      if (!this.lastStudyDate) return false;
      
      const today = new Date();
      const lastStudy = new Date(this.lastStudyDate);
      const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
      
      return daysDiff <= 1; // Active if studied today or yesterday
    }

    // Check if streak is at risk (haven't studied today)
    isStreakAtRisk() {
      if (!this.lastStudyDate) return false;
      
      const today = new Date();
      const lastStudy = new Date(this.lastStudyDate);
      const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
      
      return daysDiff === 1; // At risk if last study was yesterday
    }

    // Get streak status for UI
    getStreakStatus() {
      const today = new Date();
      const lastStudy = this.lastStudyDate ? new Date(this.lastStudyDate) : null;
      
      if (!lastStudy) {
        return {
          status: 'no_streak',
          message: 'Start your first streak',
          isAtRisk: false,
          currentStreak: 0
        };
      }

      const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        return {
          status: 'active',
          message: 'Great job! Streak maintained.',
          isAtRisk: false,
          currentStreak: this.currentStreak
        };
      } else if (daysDiff === 1) {
        return {
          status: 'at_risk',
          message: 'Study today to keep your streak!',
          isAtRisk: true,
          currentStreak: this.currentStreak
        };
      } else {
        return {
          status: 'broken',
          message: 'Streak broken. Start a new one!',
          isAtRisk: false,
          currentStreak: 0
        };
      }
    }

    // Update streak when a session is completed
    async updateForCompletedSession(sessionDurationMinutes) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const lastStudy = this.lastStudyDate;
      
      if (!lastStudy) {
        // First time studying
        this.currentStreak = 1;
        this.longestStreak = 1;
        this.lastStudyDate = today;
        this.streakStartDate = today;
        this.totalStudyTime += sessionDurationMinutes;
      } else {
        const lastStudyDate = new Date(lastStudy);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastStudyDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Already studied today - just add time
          this.totalStudyTime += sessionDurationMinutes;
        } else if (daysDiff === 1) {
          // Studied yesterday - increment streak
          this.currentStreak += 1;
          this.lastStudyDate = today;
          this.totalStudyTime += sessionDurationMinutes;
          
          // Check for new record
          if (this.currentStreak > this.longestStreak) {
            this.longestStreak = this.currentStreak;
          }
        } else {
          // Missed days - reset streak
          this.currentStreak = 1;
          this.lastStudyDate = today;
          this.streakStartDate = today;
          this.totalStudyTime += sessionDurationMinutes;
        }
      }

      await this.save();
      return this;
    }

    // Get next milestone
    getNextMilestone() {
      const milestones = [7, 14, 30, 60, 100, 365];
      return milestones.find(milestone => milestone > this.currentStreak) || null;
    }

    // Calculate progress to next milestone
    getMilestoneProgress() {
      const nextMilestone = this.getNextMilestone();
      if (!nextMilestone) return 100;
      
      return Math.floor((this.currentStreak / nextMilestone) * 100);
    }
  }

  StudyStreak.init({
    streakId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      field: 'streak_id'
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
    currentStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'current_streak',
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'longest_streak',
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    lastStudyDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'last_study_date'
    },
    streakStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'streak_start_date'
    },
    totalStudyTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_study_time',
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    sequelize,
    modelName: 'StudyStreak',
    tableName: 'study_streaks',
    timestamps: true,
    underscored: true
  });

  return StudyStreak;
};