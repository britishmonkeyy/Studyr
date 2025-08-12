/*
Module Name: Study Partners Table Migration
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Database migration for creating study partners table with partnership requests, status management, and unique partnership constraints
*/
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('study_partners', {
      partnership_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      requester_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'declined', 'blocked'),
        allowNull: false,
        defaultValue: 'pending'
      },
      matched_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      request_message: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('study_partners', ['requester_id']);
    await queryInterface.addIndex('study_partners', ['recipient_id']);
    await queryInterface.addIndex('study_partners', ['status']);
    await queryInterface.addIndex('study_partners', ['requester_id', 'recipient_id'], { 
      unique: true,
      name: 'unique_partnership'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('study_partners');
  }
};