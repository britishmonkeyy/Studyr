/*
Module Name: Study Session Model
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Sequelize model for study sessions with duration calculation, status management, recurring session support, and subject/user associations
*/
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudySession extends Model {
static associate(models) {
  // StudySession belongs to User
  StudySession.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // StudySession belongs to Subject  
  StudySession.belongsTo(models.Subject, {
    foreignKey: 'subjectId',
    as: 'subject'
  });
  // Session partners
  StudySession.hasMany(models.PartnerSession, {
    foreignKey: 'sessionId',
    as: 'partners'
  });
}

    // Calculate duration from start and end times
    calculateDuration() {
      if (this.startTime && this.endTime) {
        const start = new Date(this.startTime);
        const end = new Date(this.endTime);
        const diffMs = end - start;
        return Math.round(diffMs / (1000 * 60)); // Convert to minutes
      }
      return this.durationMinutes || 0;
    }

    // Check if session is currently active
    isActive() {
      const now = new Date();
      const start = new Date(this.startTime);
      const end = new Date(this.endTime);
      return now >= start && now <= end && this.status === 'inProgress';
    }

    // Check if session is upcoming
    isUpcoming() {
      const now = new Date();
      const start = new Date(this.startTime);
      return start > now && this.status === 'scheduled';
    }

    // Check if session is overdue
    isOverdue() {
      const now = new Date();
      const end = new Date(this.endTime);
      return end < now && this.status === 'scheduled';
    }

    // Get formatted duration string
    getFormattedDuration() {
      const minutes = this.calculateDuration();
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins}m`;
    }

    // Mark session as completed
    async complete() {
      this.status = 'completed';
      this.endTime = new Date(); // Update actual end time
      this.durationMinutes = this.calculateDuration();
      return await this.save();
    }

    // Start session
    async start() {
      this.status = 'inProgress';
      this.startTime = new Date(); // Update actual start time
      return await this.save();
    }
  }

  StudySession.init({
    sessionId: {
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
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'subject_id',
      references: {
        model: 'subjects',
        key: 'subject_id'
      }
    },
    sessionTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'session_title',
      validate: {
        notEmpty: true,
        len: [1, 200]
      }
    },
    sessionType: {
      type: DataTypes.ENUM('solo', 'partner', 'group'),
      allowNull: false,
      field: 'session_type',
      defaultValue: 'solo'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
      validate: {
        isDate: true
      }
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
      validate: {
        isDate: true,
        isAfterStart(value) {
          if (this.startTime && value <= this.startTime) {
            throw new Error('End time must be after start time');
          }
        }
      }
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_minutes',
      validate: {
        min: 1,
        max: 480 // Maximum 8 hours
      }
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: 'online'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'inProgress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_recurring',
      defaultValue: false
    },
    recurrenceRule: { // Recurring sessions isnt available currently
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'recurrence_rule',
      validate: {
        isRecurringFormat(value) {
          // Basic validation for RRULE format
          if (this.isRecurring && !value) {
            throw new Error('Recurrence rule is required for recurring sessions');
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'StudySession',
    tableName: 'study_sessions',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (session) => {
        // Auto-calculate duration if not provided
        if (!session.durationMinutes && session.startTime && session.endTime) {
          session.durationMinutes = session.calculateDuration();
        }
      },
      beforeUpdate: (session) => {
        // Recalculate duration if times changed
        if (session.changed('startTime') || session.changed('endTime')) {
          session.durationMinutes = session.calculateDuration();
        }
      }
    },
    indexes: [
      {
        fields: ['user_id', 'start_time']
      },
      {
        fields: ['subject_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  return StudySession;
};