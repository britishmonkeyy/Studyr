'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subjects', {
      subject_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      subject_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      subject_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM('mathematics','english', 'psychology','physics','biology', 'history', 'languages', 'arts', 'technology', 'business', 'other'),
        allowNull: false,
        defaultValue: 'other'
      },
      color_hex: {
        type: Sequelize.STRING(7),
        allowNull: false,
        defaultValue: '#4ECDC4'
      },
      icon_emoji: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: '📚'
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
    await queryInterface.addIndex('subjects', ['subject_name']);
    await queryInterface.addIndex('subjects', ['category']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subjects');
  }
};