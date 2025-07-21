'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create achievements table
    await queryInterface.createTable('achievements', {
      achievement_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      achievement_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      badge_icon: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Emoji or icon identifier'
      },
      points_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      category: {
        type: Sequelize.ENUM('streak', 'hours', 'social', 'subject', 'consistency', 'milestone'),
        allowNull: false
      },
      criteria_json: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'JSON object defining achievement criteria'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Create user_achievements junction table
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
        allowNull: false
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
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('achievements', ['category']);
    await queryInterface.addIndex('user_achievements', ['user_id']);
    await queryInterface.addIndex('user_achievements', ['achievement_id']);
    await queryInterface.addIndex('user_achievements', ['user_id', 'achievement_id'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_achievements');
    await queryInterface.dropTable('achievements');
  }
};