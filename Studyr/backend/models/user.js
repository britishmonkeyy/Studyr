/*
Module Name: User Model
Module Author: Adam Bolton
Date Modified: 21/08/2025
Description: Sequelize model for user accounts with authentication, profile management, study level tracking, and associated relationships to sessions and subjects
*/
'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User has many StudySessions
      User.hasMany(models.StudySession, {
        foreignKey: 'userId',
        as: 'studySessions'
      });

      // User has many Subjects
      User.hasMany(models.Subject, {
        foreignKey: 'userId',
        as: 'subjects'
      });

      // User has one StudyStreak
      User.hasOne(models.StudyStreak, {
        foreignKey: 'userId',
        as: 'streak'
      });

      // User has many UserAnalytics
      User.hasMany(models.UserAnalytics, {
        foreignKey: 'userId',
        as: 'analytics'
      });
        // Messages sent
      User.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'sentMessages'
      });
        // Messages received
      User.hasMany(models.Message, {
        foreignKey: 'recipientId',
        as: 'receivedMessages'
      });

      // Partnership requests sent
      User.hasMany(models.StudyPartner, {
        foreignKey: 'requesterId',
        as: 'sentPartnerRequests'
      });

      // Partnership requests received
      User.hasMany(models.StudyPartner, {
        foreignKey: 'recipientId',
        as: 'receivedPartnerRequests'
      });
        // Session partnerships
      User.hasMany(models.PartnerSession, {
        foreignKey: 'partnerId',
        as: 'sessionInvitations'
      });
    }

    // Instance method to check password
    async validatePassword(password) {
      return await bcrypt.compare(password, this.passwordHash);
    }

    // Instance method to set password
    async setPassword(password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(password, salt);
    }

    // Calculate age from date of birth
    calculateAge() {
      const today = new Date();
      const birthDate = new Date(this.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }

    // Get full name
    getFullName() {
      return `${this.firstName} ${this.lastName}`;
    }

    // JSON serialization (exclude sensitive data)
    toJSON() {
      const values = { ...this.get() };
      delete values.passwordHash;
      return values;
    }

    // Get user's subject count
    async getSubjectCount() {
      const { Subject } = require('./subject');
      return await Subject.count({
        where: { userId: this.userId }
      });
    }

    // Create default subjects for new user (Doesn't work currently?)
    async createDefaultSubjects() { // Added breakpoint and stepped through (didn't fix)
      const { Subject } = require('./index'); // Fixed as of 21/08/2025
      
      const defaultSubjects = [
        {
          subjectName: 'Mathematics',
          category: 'mathematics',
          colorHex: '#42a6e9ff',
          iconEmoji: '🔢'
        },
        {
          subjectName: 'English',
          category: 'english', 
          colorHex: '#15dd62ff',
          iconEmoji: '📖'
        },
        {
          subjectName: 'Physics',
          category: 'physics',
          colorHex: '#8bc72bff',
          iconEmoji: '🔬'
        }
      ];

      const subjects = await Subject.bulkCreate(
        defaultSubjects.map(subject => ({
          ...subject,
          userId: this.userId
        }))
      );

      return subjects;
    }
  }

  User.init({
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true
      }
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'first_name',
      validate: {
        notEmpty: true
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'last_name',
      validate: {
        notEmpty: true
      }
    },
    profilePictureUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_picture_url',
      validate: {
        isUrl: true
      }
    },
    studyLevel: {
      type: DataTypes.ENUM('high_school', 'university', 'professional'),
      allowNull: false,
      field: 'study_level'
    },
    yearLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'year_level',
      validate: {
        min: 1,
        max: 12
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_of_birth',
      validate: {
        isDate: true,
        isBefore: new Date().toISOString() // Must be in the past
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_premium'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'Australia/Melbourne'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      // Before creating & updating user, validate age
      beforeCreate: async (user) => {
        const age = user.calculateAge();
        if (age < 13) {
          throw new Error('User must be at least 13 years old');
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('dateOfBirth')) {
          const age = user.calculateAge();
          if (age < 13) {
            throw new Error('User must be at least 13 years old');
          }
        }
      },
      // After user is created, create default subjects
      afterCreate: async (user) => {
        try {
          await user.createDefaultSubjects();
          console.log(`Created default subjects for user: ${user.email}`);
        } catch (error) {
          console.error(`Failed to create default subjects for user ${user.email}:`, error); // <- currently recieving this error
        }
      }
    }
  });

  return User;
};