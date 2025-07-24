'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
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
        defaultValue: 10,
        validate: {
          min: 1
        }
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
    await queryInterface.addIndex('achievements', ['category']);
    await queryInterface.addIndex('achievements', ['is_active']);
    await queryInterface.addIndex('achievements', ['achievement_name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('achievements');
  }
};