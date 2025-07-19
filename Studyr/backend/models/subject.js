'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subject extends Model {
  static associate(models) {
    // Subject has many StudySessions
    Subject.hasMany(models.StudySession, {
      foreignKey: 'subjectId',
      as: 'studySessions'
    });
    
    // Removing this for now since i don't have UserSubject model yet
    // Subject.belongsToMany(models.User, {
    //   through: 'UserSubjects',
    //   foreignKey: 'subjectId',
    //   as: 'users'
    // });
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
  }

  Subject.init({
    subjectId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
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
        'science', 
        'humanities',
        'languages',
        'arts',
        'technology',
        'business',
        'other'
      ),
      allowNull: false,
      defaultValue: 'other'
    },
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
    }
  });

  return Subject;
};