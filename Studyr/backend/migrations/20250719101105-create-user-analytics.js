/*
Module Name: User Analytics Table Migration
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Database migration for creating user analytics table with daily metrics, productivity tracking, and subject distribution analysis
*/
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_analytics', {
      analytics_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      total_study_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      sessions_completed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      sessions_scheduled: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      subjects_studied: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of subject IDs studied this day'
      },
      productivity_average: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 5
        }
      },
      focus_time_percentage: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('user_analytics', ['user_id', 'date'], { unique: true });
    await queryInterface.addIndex('user_analytics', ['date']);
    await queryInterface.addIndex('user_analytics', ['user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_analytics');
  }
};