/*
Module Name: Subject Modelling
Module Author: Adam Bolton
Date Modified:
Description:
*/
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subject extends Model {
    static associate(models) {
      // Subject belongs to User
      Subject.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      // Subject has many StudySessions
      Subject.hasMany(models.StudySession, {
        foreignKey: 'subjectId',
        as: 'studySessions'
      });
    }

    // Get a random color for new subjects
    static getRandomColor() {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    // Get formatted display name
    getDisplayName() {
      return this.subjectCode 
        ? `${this.subjectCode} - ${this.subjectName}`
        : this.subjectName;
    }

    // Check if user owns this subject
    isOwnedBy(userId) {
      return this.userId === userId;
    }
  }

  Subject.init({
    subjectId: {
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
    subjectName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'subject_name',
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    subjectCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'subject_code',
      validate: {
        len: [0, 20]
      }
    },
    category: {
      type: DataTypes.ENUM(
        'mathematics',
        'english',
        'psychology',
        'physics',
        'biology',
        'history',
        'languages',
        'arts',
        'technology',
        'business',
        'other'
      ),
      allowNull: false,
      defaultValue: 'other'
    },
       /* category: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'other'
    }, */
    colorHex: {
      type: DataTypes.STRING(7),
      allowNull: false,
      field: 'color_hex',
      defaultValue: '#4ECDC4',
      validate: {
        is: /^#[0-9A-F]{6}$/i // Validates hex color format
      }
    },
    iconEmoji: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'icon_emoji',
      defaultValue: '📚'
    }
  }, {
    sequelize,
    modelName: 'Subject',
    tableName: 'subjects',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (subject) => {
        // Set random color if not provided
        if (!subject.colorHex) {
          subject.colorHex = Subject.getRandomColor();
        }
      }
    },
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['user_id', 'subject_name']
      },
      {
        fields: ['category']
      }
    ]
  });

  return Subject;
};