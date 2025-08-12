/*
Module Name: Partner Sessions Table Migration
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Database migration for creating partner sessions table enabling collaborative study sessions with invitation and participation tracking
Disclaimer: CURRENTLY UNUSED MIGRATION TABLE IMPLEMENTATION TBD
*/
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('partner_sessions', {
      partner_session_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'study_sessions',
          key: 'session_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      partner_id: {
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
        type: Sequelize.ENUM('invited', 'accepted', 'declined'),
        allowNull: false,
        defaultValue: 'invited'
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      invitation_message: {
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
    await queryInterface.addIndex('partner_sessions', ['session_id']);
    await queryInterface.addIndex('partner_sessions', ['partner_id']);
    await queryInterface.addIndex('partner_sessions', ['status']);
    await queryInterface.addIndex('partner_sessions', ['session_id', 'partner_id'], { 
      unique: true,
      name: 'unique_session_partner'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('partner_sessions');
  }
};