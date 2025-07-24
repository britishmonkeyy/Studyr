'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_achievements', {
      user_achievement_id: {
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
      achievement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'achievements',
          key: 'achievement_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      earned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      progress_percentage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        validate: {
          min: 0,
          max: 100
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('user_achievements', ['user_id']);
    await queryInterface.addIndex('user_achievements', ['achievement_id']);
    await queryInterface.addIndex('user_achievements', ['user_id', 'achievement_id'], { 
      unique: true,
      name: 'unique_user_achievement'
    });
    await queryInterface.addIndex('user_achievements', ['earned_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_achievements');
  }
};