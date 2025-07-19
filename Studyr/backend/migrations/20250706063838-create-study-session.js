'use strict';
// Migration to db file
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('study_sessions', {
      session_id: {
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
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'subjects',
          key: 'subject_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      session_title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      session_type: {
        type: Sequelize.ENUM('solo', 'partner', 'group'),
        allowNull: false,
        defaultValue: 'solo'
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: 'online'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'inProgress', 'completed', 'cancelled'), 
        allowNull: false,
        defaultValue: 'scheduled'
      },
      is_recurring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      recurrence_rule: {
        type: Sequelize.STRING(255),
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
    await queryInterface.addIndex('study_sessions', ['user_id', 'start_time']);
    await queryInterface.addIndex('study_sessions', ['subject_id']);
    await queryInterface.addIndex('study_sessions', ['status']);
    await queryInterface.addIndex('study_sessions', ['start_time']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('study_sessions');
  }
};