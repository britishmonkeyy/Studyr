'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('study_streaks', {
      streak_id: {
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
      current_streak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      longest_streak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      last_study_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      streak_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      total_study_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total study time in minutes'
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
    await queryInterface.addIndex('study_streaks', ['user_id']);
    await queryInterface.addIndex('study_streaks', ['current_streak']);
    await queryInterface.addIndex('study_streaks', ['last_study_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('study_streaks');
  }
};